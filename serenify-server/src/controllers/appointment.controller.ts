import type { Request, Response } from 'express'
import { AppointmentStatus, AppointmentType, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'

const dayNames = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

const pad = (value: number) => String(value).padStart(2, '0')

const formatDateKey = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`

const formatTime = (date: Date) => `${pad(date.getHours())}:${pad(date.getMinutes())}`

const buildSlotKey = (dateKey: string, time: string) => `${dateKey} ${time}`

const getAvailabilityConfig = (availability: unknown) => {
  const safe = availability as {
    timezone?: string
    slots?: Record<string, string[]>
  }
  return {
    timezone: safe?.timezone ?? 'UTC',
    slots: safe?.slots ?? {},
  }
}

const ensureUser = (req: Request, res: Response) => {
  const user = req.user
  if (!user) {
    res.status(401).json({ message: 'Unauthorized' })
    return null
  }
  return user
}

export const getAppointments = async (req: Request, res: Response) => {
  try {
    const user = ensureUser(req, res)
    if (!user) {
      return
    }

    const status = String(req.query.status ?? '')
    const now = new Date()

    const where: Prisma.AppointmentWhereInput = { userId: user.id }

    if (status === 'upcoming') {
      where.datetime = { gte: now }
      where.status = { notIn: [AppointmentStatus.CANCELLED] }
    } else if (status === 'past') {
      where.OR = [
        { datetime: { lt: now } },
        { status: AppointmentStatus.CANCELLED },
      ]
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        therapist: {
          select: {
            id: true,
            name: true,
            specialty: true,
            avatarUrl: true,
            price: true,
          },
        },
      },
      orderBy: { datetime: status === 'upcoming' ? 'asc' : 'desc' },
    })

    res.status(200).json({ appointments })
  } catch (error) {
    console.error('getAppointments error:', error)
    res.status(500).json({ error: 'Failed to fetch appointments' })
  }
}

export const createAppointment = async (req: Request, res: Response) => {
  const user = ensureUser(req, res)
  if (!user) {
    return
  }

  if (user.plan === 'FREE') {
    res.status(403).json({ message: 'Upgrade required to book sessions' })
    return
  }

  const { therapistId, datetime, type, notes } = req.body as {
    therapistId: string
    datetime: string
    type: AppointmentType
    notes?: string
  }

  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId },
  })

  if (!therapist) {
    res.status(404).json({ message: 'Therapist not found' })
    return
  }

  const appointmentDate = new Date(datetime)
  if (Number.isNaN(appointmentDate.getTime())) {
    res.status(400).json({ message: 'Invalid appointment datetime' })
    return
  }

  if (appointmentDate.getTime() < Date.now()) {
    res.status(400).json({ message: 'Appointment must be in the future' })
    return
  }

  const availability = getAvailabilityConfig(therapist.availability)
  const dateKey = formatDateKey(appointmentDate)
  const dayName = dayNames[appointmentDate.getDay()]
  const time = formatTime(appointmentDate)
  const daySlots = availability.slots[dayName] ?? []

  if (!daySlots.includes(time)) {
    res.status(400).json({ message: 'Selected time is not available' })
    return
  }

  const existing = await prisma.appointment.findFirst({
    where: {
      therapistId,
      datetime: appointmentDate,
      status: { not: AppointmentStatus.CANCELLED },
    },
  })

  if (existing) {
    res.status(409).json({ message: 'Slot already booked' })
    return
  }

  const appointment = await prisma.appointment.create({
    data: {
      userId: user.id,
      therapistId,
      datetime: appointmentDate,
      type,
      status: AppointmentStatus.PENDING,
      notes: notes?.trim() || null,
    },
    include: { therapist: true },
  })

  res.status(201).json(appointment)
}

export const cancelAppointment = async (req: Request, res: Response) => {
  const user = ensureUser(req, res)
  if (!user) {
    return
  }

  const appointmentId = String(req.params.id)
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
    include: { therapist: true },
  })

  if (!appointment) {
    res.status(404).json({ message: 'Appointment not found' })
    return
  }

  const diffMs = appointment.datetime.getTime() - Date.now()
  const hoursAway = diffMs / (1000 * 60 * 60)

  if (hoursAway < 24) {
    res.status(400).json({ message: 'Cannot cancel within 24 hours' })
    return
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { status: AppointmentStatus.CANCELLED },
    include: { therapist: true },
  })

  res.status(200).json(updated)
}

export const rescheduleAppointment = async (req: Request, res: Response) => {
  const user = ensureUser(req, res)
  if (!user) {
    return
  }

  const appointmentId = String(req.params.id)
  const appointment = await prisma.appointment.findFirst({
    where: { id: appointmentId, userId: user.id },
  })

  if (!appointment) {
    res.status(404).json({ message: 'Appointment not found' })
    return
  }

  const { datetime } = req.body as { datetime: string }
  const nextDate = new Date(datetime)

  if (Number.isNaN(nextDate.getTime())) {
    res.status(400).json({ message: 'Invalid appointment datetime' })
    return
  }

  if (nextDate.getTime() < Date.now()) {
    res.status(400).json({ message: 'Appointment must be in the future' })
    return
  }

  const therapist = await prisma.therapist.findUnique({
    where: { id: appointment.therapistId },
  })

  if (!therapist) {
    res.status(404).json({ message: 'Therapist not found' })
    return
  }

  const availability = getAvailabilityConfig(therapist.availability)
  const dateKey = formatDateKey(nextDate)
  const dayName = dayNames[nextDate.getDay()]
  const time = formatTime(nextDate)
  const daySlots = availability.slots[dayName] ?? []

  if (!daySlots.includes(time)) {
    res.status(400).json({ message: 'Selected time is not available' })
    return
  }

  const existing = await prisma.appointment.findFirst({
    where: {
      therapistId: appointment.therapistId,
      datetime: nextDate,
      status: { not: AppointmentStatus.CANCELLED },
      id: { not: appointment.id },
    },
  })

  if (existing) {
    res.status(409).json({ message: 'Slot already booked' })
    return
  }

  const updated = await prisma.appointment.update({
    where: { id: appointment.id },
    data: { datetime: nextDate, status: AppointmentStatus.PENDING },
    include: { therapist: true },
  })

  res.status(200).json(updated)
}
