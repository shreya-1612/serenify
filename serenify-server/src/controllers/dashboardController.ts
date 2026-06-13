import type { Request, Response } from 'express'
import prisma from '../utils/prisma'

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

const formatDateKey = (date: Date) => date.toISOString().slice(0, 10)

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

type ActivityItem = {
  type: string
  label: string
  at: Date
}

export const getDashboard = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const [userResult, moodResult, quoteResult, checklistResult, recentResult] =
      await Promise.allSettled([
        prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, name: true, plan: true, streak: true, avatar: true },
        }),
        prisma.moodLog.findFirst({
          where: { userId, date: { gte: today, lt: tomorrow } },
        }),
        (async () => {
          const count = await prisma.quote.count()
          if (count === 0) return null
          const skip = Math.floor(Math.random() * count)
          return prisma.quote.findFirst({ skip, orderBy: { id: 'asc' } })
        })(),
        prisma.checklistItem.findMany({
          where: { userId, isActive: true },
          include: {
            logs: { where: { completedAt: { gte: today, lt: tomorrow } } },
          },
        }),
        prisma.exerciseLog.findMany({
          where: { userId },
          orderBy: { completedAt: 'desc' },
          take: 5,
          include: { exercise: { select: { title: true, category: true } } },
        }),
      ])

    const userData =
      userResult.status === 'fulfilled' && userResult.value
        ? userResult.value
        : {
            id: userId,
            name: 'Friend',
            plan: 'FREE',
            streak: 0,
            avatar: null,
          }
    const mood = moodResult.status === 'fulfilled' ? moodResult.value : null
    const dailyQuote =
      quoteResult.status === 'fulfilled' && quoteResult.value
        ? quoteResult.value
        : {
            id: 'fallback',
            text: 'Every day is a new beginning. Take a deep breath and start again.',
            author: 'Unknown',
            category: 'encouragement',
          }
    const checklist =
      checklistResult.status === 'fulfilled' ? checklistResult.value : []
    const exercises = recentResult.status === 'fulfilled' ? recentResult.value : []

    const totalChecklist = checklist.length
    const completedChecklist = checklist.filter(
      (item) => item.logs && item.logs.length > 0,
    ).length

    res.json({
      user: userData,
      todaysMood: mood,
      dailyQuote,
      checklistSummary: { total: totalChecklist, completed: completedChecklist },
      weeklyStats: {
        exercisesCompleted: exercises.length,
        sessionCount: 0,
        minutesMeditated: exercises.reduce(
          (acc, exercise) => acc + (exercise.durationMinutes || 0),
          0,
        ),
      },
      recentActivity: exercises.map((exercise) => ({
        type: 'exercise',
        label: `Completed ${exercise.exercise?.title || 'Exercise'}`,
        at: exercise.completedAt,
      })),
      streakData: [],
    })
  } catch (error) {
    console.error('Dashboard error:', error)
    res.status(500).json({
      error: 'Failed to load dashboard',
      details: error instanceof Error ? error.message : 'Unknown error',
    })
  }
}
