import type { Request, Response } from 'express'
import type { ChecklistFrequency } from '@prisma/client'
import prisma from '../utils/prisma'

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

const dateKeyUtc = (date: Date) => date.toISOString().slice(0, 10)

const ensureUser = (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return null
  }
  return userId
}

const buildDifficulty = (frequency: ChecklistFrequency) =>
  frequency === 'DAILY' ? 2 : 1

const computeStreak = (logs: Array<{ completedAt: Date }>, todayStart: Date) => {
  const completedDays = new Set(logs.map((log) => dateKeyUtc(log.completedAt)))
  let streak = 0
  for (let offset = 0; offset < 365; offset += 1) {
    const dayKey = dateKeyUtc(addUtcDays(todayStart, -offset))
    if (!completedDays.has(dayKey)) {
      break
    }
    streak += 1
  }
  return streak
}

export const getChecklist = async (req: Request, res: Response) => {
  const userId = ensureUser(req, res)
  if (!userId) {
    return
  }

  const todayStart = startOfUtcDay(new Date())
  const tomorrowStart = addUtcDays(todayStart, 1)

  const items = await prisma.checklistItem.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  })

  const logs = await prisma.checklistLog.findMany({
    where: {
      userId,
      completedAt: { gte: todayStart, lt: tomorrowStart },
    },
    select: { itemId: true },
  })

  const completedIds = new Set(logs.map((log) => log.itemId))
  const activeItems = items.filter((item) => item.isActive)

  res.status(200).json({
    date: todayStart.toISOString(),
    total: activeItems.length,
    completed: activeItems.filter((item) => completedIds.has(item.id)).length,
    items: items.map((item) => ({
      ...item,
      isCompleted: completedIds.has(item.id),
      difficulty: buildDifficulty(item.frequency),
    })),
  })
}

export const createChecklistItem = async (req: Request, res: Response) => {
  const userId = ensureUser(req, res)
  if (!userId) {
    return
  }

  const { label, emoji, frequency } = req.body as {
    label: string
    emoji: string
    frequency: ChecklistFrequency
  }

  const item = await prisma.checklistItem.create({
    data: {
      userId,
      label: label.trim(),
      emoji: emoji.trim(),
      frequency,
      isDefault: false,
      isActive: true,
      streak: 0,
    },
  })

  res.status(201).json({
    ...item,
    isCompleted: false,
    difficulty: buildDifficulty(item.frequency),
  })
}

export const updateChecklistItem = async (req: Request, res: Response) => {
  const userId = ensureUser(req, res)
  if (!userId) {
    return
  }

  const itemId = String(req.params.id)

  const { label, emoji, frequency, isActive } = req.body as {
    label?: string
    emoji?: string
    frequency?: ChecklistFrequency
    isActive?: boolean
  }

  const existing = await prisma.checklistItem.findFirst({
    where: { id: itemId, userId },
  })

  if (!existing) {
    res.status(404).json({ message: 'Checklist item not found' })
    return
  }

  const updated = await prisma.checklistItem.update({
    where: { id: existing.id },
    data: {
      label: label?.trim() ?? existing.label,
      emoji: emoji?.trim() ?? existing.emoji,
      frequency: frequency ?? existing.frequency,
      isActive: typeof isActive === 'boolean' ? isActive : existing.isActive,
    },
  })

  const todayStart = startOfUtcDay(new Date())
  const tomorrowStart = addUtcDays(todayStart, 1)
  const completed = await prisma.checklistLog.findFirst({
    where: {
      itemId: updated.id,
      userId,
      completedAt: { gte: todayStart, lt: tomorrowStart },
    },
    select: { id: true },
  })

  res.status(200).json({
    ...updated,
    isCompleted: Boolean(completed),
    difficulty: buildDifficulty(updated.frequency),
  })
}

export const deleteChecklistItem = async (req: Request, res: Response) => {
  const userId = ensureUser(req, res)
  if (!userId) {
    return
  }

  const itemId = String(req.params.id)

  const existing = await prisma.checklistItem.findFirst({
    where: { id: itemId, userId },
  })

  if (!existing) {
    res.status(404).json({ message: 'Checklist item not found' })
    return
  }

  await prisma.$transaction([
    prisma.checklistLog.deleteMany({ where: { itemId: existing.id } }),
    prisma.checklistItem.delete({ where: { id: existing.id } }),
  ])

  res.status(200).json({ message: 'Checklist item deleted' })
}

export const completeChecklistItem = async (req: Request, res: Response) => {
  const userId = ensureUser(req, res)
  if (!userId) {
    return
  }

  const itemId = String(req.params.id)

  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, userId },
  })

  if (!item) {
    res.status(404).json({ message: 'Checklist item not found' })
    return
  }

  const todayStart = startOfUtcDay(new Date())
  const tomorrowStart = addUtcDays(todayStart, 1)

  const existing = await prisma.checklistLog.findFirst({
    where: {
      itemId: item.id,
      userId,
      completedAt: { gte: todayStart, lt: tomorrowStart },
    },
  })

  if (!existing) {
    await prisma.checklistLog.create({
      data: {
        itemId: item.id,
        userId,
        completedAt: new Date(),
      },
    })
  }

  const logs = await prisma.checklistLog.findMany({
    where: { itemId: item.id, userId },
    select: { completedAt: true },
    orderBy: { completedAt: 'desc' },
    take: 365,
  })

  const streak = computeStreak(logs, todayStart)

  const updated = await prisma.checklistItem.update({
    where: { id: item.id },
    data: { streak },
  })

  res.status(200).json({
    ...updated,
    isCompleted: true,
    difficulty: buildDifficulty(updated.frequency),
  })
}

export const undoChecklistItem = async (req: Request, res: Response) => {
  const userId = ensureUser(req, res)
  if (!userId) {
    return
  }

  const itemId = String(req.params.id)

  const item = await prisma.checklistItem.findFirst({
    where: { id: itemId, userId },
  })

  if (!item) {
    res.status(404).json({ message: 'Checklist item not found' })
    return
  }

  const todayStart = startOfUtcDay(new Date())
  const tomorrowStart = addUtcDays(todayStart, 1)

  await prisma.checklistLog.deleteMany({
    where: {
      itemId: item.id,
      userId,
      completedAt: { gte: todayStart, lt: tomorrowStart },
    },
  })

  const logs = await prisma.checklistLog.findMany({
    where: { itemId: item.id, userId },
    select: { completedAt: true },
    orderBy: { completedAt: 'desc' },
    take: 365,
  })

  const streak = computeStreak(logs, todayStart)

  const updated = await prisma.checklistItem.update({
    where: { id: item.id },
    data: { streak },
  })

  res.status(200).json({
    ...updated,
    isCompleted: false,
    difficulty: buildDifficulty(updated.frequency),
  })
}
