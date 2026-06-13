import type { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import type { Mood } from '@prisma/client'
import prisma from '../utils/prisma'

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

const ensureValid = (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return false
  }
  return true
}

export const logMood = async (req: Request, res: Response) => {
  if (!ensureValid(req, res)) {
    return
  }

  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const { mood, note } = req.body as { mood: Mood; note?: string }
  const now = new Date()
  const todayStart = startOfUtcDay(now)
  const tomorrowStart = addUtcDays(todayStart, 1)

  const existing = await prisma.moodLog.findFirst({
    where: {
      userId,
      date: { gte: todayStart, lt: tomorrowStart },
    },
  })

  const entry = existing
    ? await prisma.moodLog.update({
        where: { id: existing.id },
        data: { mood, note: note ?? existing.note, date: todayStart },
      })
    : await prisma.moodLog.create({
        data: { userId, mood, note, date: todayStart },
      })

  res.status(201).json(entry)
}

export const getMoodHistory = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const todayStart = startOfUtcDay(new Date())
  const monthStart = addUtcDays(todayStart, -29)

  const logs = await prisma.moodLog.findMany({
    where: { userId, date: { gte: monthStart, lt: addUtcDays(todayStart, 1) } },
    orderBy: { date: 'desc' },
  })

  res.status(200).json(logs)
}

export const getMoodWeekly = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const todayStart = startOfUtcDay(new Date())
  const weekStart = addUtcDays(todayStart, -6)

  const logs = await prisma.moodLog.findMany({
    where: { userId, date: { gte: weekStart, lt: addUtcDays(todayStart, 1) } },
  })

  const breakdown = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.mood] = (acc[log.mood] ?? 0) + 1
    return acc
  }, {})

  res.status(200).json(breakdown)
}
