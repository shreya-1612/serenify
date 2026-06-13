import type { Request, Response } from 'express'
import type { ExerciseCategory, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'

export const listExercises = async (req: Request, res: Response) => {
  const category = req.query.category as ExerciseCategory | undefined
  const difficulty = req.query.difficulty
    ? Number(req.query.difficulty)
    : undefined

  const where: Prisma.ExerciseWhereInput = {
    ...(category && { category }),
    ...(difficulty && { difficulty }),
  }

  const limit = (req as Request & { planLimits?: { exerciseLimit?: number } })
    .planLimits?.exerciseLimit

  const [count, exercises] = await Promise.all([
    prisma.exercise.count(),
    prisma.exercise.findMany({
      where,
      orderBy: { title: 'asc' },
      ...(limit ? { take: limit } : {}),
    }),
  ])

  if (count === 0) {
    console.log('Exercise count:', count)
  }

  res.status(200).json({ exercises })
}

export const getExerciseById = async (req: Request, res: Response) => {
  const exerciseId = String(req.params.id)
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  })

  if (!exercise) {
    res.status(404).json({ message: 'Exercise not found' })
    return
  }

  res.status(200).json(exercise)
}

export const completeExercise = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const { durationMinutes, notes } = req.body as {
    durationMinutes?: number
    notes?: string
  }

  const exerciseId = String(req.params.id)
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  })

  if (!exercise) {
    res.status(404).json({ message: 'Exercise not found' })
    return
  }

  const log = await prisma.exerciseLog.create({
    data: {
      userId,
      exerciseId: exercise.id,
      durationMinutes: durationMinutes ?? exercise.duration,
      notes: notes?.slice(0, 2000),
    },
  })

  res.status(201).json(log)
}

export const getExerciseHistory = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const history = await prisma.exerciseLog.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    include: { exercise: true },
  })

  res.status(200).json(history)
}

export const saveJournalEntry = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  const { content } = req.body as { content?: string }
  if (!content || !content.trim()) {
    res.status(400).json({ message: 'Entry content is required' })
    return
  }

  const exerciseId = String(req.params.id)
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
  })

  if (!exercise) {
    res.status(404).json({ message: 'Exercise not found' })
    return
  }

  const log = await prisma.exerciseLog.create({
    data: {
      userId,
      exerciseId: exercise.id,
      durationMinutes: exercise.duration,
      notes: content.slice(0, 2000),
    },
  })

  res.status(201).json(log)
}
