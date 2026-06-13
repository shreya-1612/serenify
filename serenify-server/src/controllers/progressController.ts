import type { Request, Response } from 'express'
import prisma from '../utils/prisma'

const moodScores: Record<string, number> = {
  HAPPY: 5,
  CALM: 4,
  NEUTRAL: 3,
  SAD: 2,
  ANXIOUS: 1,
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

export const getWeeklyProgress = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const now = new Date()
    const weekAgo = startOfDay(new Date(now))
    weekAgo.setDate(weekAgo.getDate() - 6)

    const [moodLogs, exerciseLogs, checklistLogs] = await Promise.allSettled([
      prisma.moodLog.findMany({
        where: { userId, createdAt: { gte: weekAgo } },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.exerciseLog.findMany({
        where: { userId, completedAt: { gte: weekAgo } },
        include: { exercise: true },
      }),
      prisma.checklistLog.findMany({
        where: { userId, completedAt: { gte: weekAgo } },
      }),
    ])

    const moods = moodLogs.status === 'fulfilled' ? moodLogs.value : []
    const exercises = exerciseLogs.status === 'fulfilled' ? exerciseLogs.value : []
    const checklist = checklistLogs.status === 'fulfilled' ? checklistLogs.value : []

    const moodBreakdown: Record<string, number> = {
      HAPPY: 0,
      CALM: 0,
      NEUTRAL: 0,
      SAD: 0,
      ANXIOUS: 0,
    }

    moods.forEach((log) => {
      if (moodBreakdown[log.mood] !== undefined) {
        moodBreakdown[log.mood] += 1
      }
    })

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const moodTrend = days.map((day, index) => {
      const date = new Date(weekAgo)
      date.setDate(date.getDate() + index)
      const dayMood = moods.find((log) => {
        const moodDate = new Date(log.createdAt)
        return moodDate.toDateString() === date.toDateString()
      })

      return {
        day,
        score: dayMood ? moodScores[dayMood.mood] || 3 : null,
      }
    })

    const exerciseByDay = days.map((day, index) => {
      const date = new Date(weekAgo)
      date.setDate(date.getDate() + index)
      const dayExercises = exercises.filter((entry) => {
        const exerciseDate = new Date(entry.completedAt)
        return exerciseDate.toDateString() === date.toDateString()
      })

      return {
        day,
        minutes: dayExercises.reduce(
          (sum, entry) => sum + (entry.durationMinutes || 0),
          0,
        ),
      }
    })

    const totalMoods = Object.values(moodBreakdown).reduce((a, b) => a + b, 0)
    const moodPercentages: Record<string, number> = {}
    Object.keys(moodBreakdown).forEach((key) => {
      moodPercentages[key] =
        totalMoods > 0 ? Math.round((moodBreakdown[key] / totalMoods) * 100) : 0
    })

    res.status(200).json({
      moodBreakdown: moodPercentages,
      moodTrend,
      exerciseByDay,
      checklistRate: checklist.length,
      totalExercises: exercises.length,
      totalMoodLogs: moods.length,
      minutesMeditated: exercises.reduce(
        (sum, entry) => sum + (entry.durationMinutes || 0),
        0,
      ),
    })
  } catch (error) {
    console.error('getWeeklyProgress error:', error)
    res.status(500).json({ error: 'Failed to load progress' })
  }
}
