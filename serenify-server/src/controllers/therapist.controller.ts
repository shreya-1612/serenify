import type { Request, Response } from 'express'
import { AppointmentStatus, Prisma } from '@prisma/client'
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

const loadBookedSlotKeys = async (
  therapistId: string,
  start: Date,
  end: Date,
) => {
  const appointments = await prisma.appointment.findMany({
    where: {
      therapistId,
      status: { not: AppointmentStatus.CANCELLED },
      datetime: { gte: start, lt: end },
    },
    select: { datetime: true },
  })

  return new Set(
    appointments.map((appointment) => {
      const dateKey = formatDateKey(appointment.datetime)
      const time = formatTime(appointment.datetime)
      return buildSlotKey(dateKey, time)
    }),
  )
}

export const getTherapists = async (req: Request, res: Response) => {
  const search = String(req.query.search ?? '').trim()
  const specialty = String(req.query.specialty ?? '').trim()

  const where: Prisma.TherapistWhereInput = {
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { specialty: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}),
    ...(specialty
      ? { specialty: { contains: specialty, mode: 'insensitive' } }
      : {}),
  }

  const therapists = await prisma.therapist.findMany({
    where,
    orderBy: { rating: 'desc' },
  })

  res.status(200).json(therapists)
}

export const getTherapistById = async (req: Request, res: Response) => {
  const therapistId = String(req.params.id)
  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId },
  })

  if (!therapist) {
    res.status(404).json({ message: 'Therapist not found' })
    return
  }

  res.status(200).json(therapist)
}

export const getTherapistAvailability = async (req: Request, res: Response) => {
  const therapistId = String(req.params.id)
  const therapist = await prisma.therapist.findUnique({
    where: { id: therapistId },
  })

  if (!therapist) {
    res.status(404).json({ message: 'Therapist not found' })
    return
  }

  const availability = getAvailabilityConfig(therapist.availability)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 14)

  const bookedKeys = await loadBookedSlotKeys(therapist.id, start, end)

  const days: Array<{ date: string; slots: string[] }> = []

  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(start)
    date.setDate(start.getDate() + offset)
    const dayName = dayNames[date.getDay()]
    const slots = availability.slots[dayName] ?? []
    if (slots.length === 0) {
      continue
    }

    const dateKey = formatDateKey(date)
    const availableSlots = slots.filter(
      (time) => !bookedKeys.has(buildSlotKey(dateKey, time)),
    )

    if (availableSlots.length > 0) {
      days.push({ date: dateKey, slots: availableSlots })
    }
  }

  res.status(200).json({ therapistId: therapist.id, days })
}
