import type { NextFunction, Request, Response } from 'express'
import { Plan } from '@prisma/client'
import prisma from '../utils/prisma'

type LimitFeature = 'chat' | 'exercise-view' | 'therapy-booking'

type PlanLimits = {
  exerciseLimit?: number
}

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate())

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

export default function checkPlanLimit(feature: LimitFeature) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    if (!user) {
      res.status(401).json({ message: 'Unauthorized' })
      return
    }

    if (feature === 'exercise-view') {
      const limits: PlanLimits = {}
      if (user.plan === Plan.FREE) {
        limits.exerciseLimit = 3
      }
      ;(req as Request & { planLimits?: PlanLimits }).planLimits = limits
      next()
      return
    }

    if (feature === 'chat') {
      if (user.plan !== Plan.FREE) {
        next()
        return
      }

      const todayStart = startOfDay(new Date())
      const tomorrowStart = addDays(todayStart, 1)
      const messageCount = await prisma.chatMessage.count({
        where: {
          role: 'USER',
          createdAt: { gte: todayStart, lt: tomorrowStart },
          session: { userId: user.id },
        },
      })

      if (messageCount >= 5) {
        res.status(403).json({ message: 'Daily chat limit reached for Free plan.' })
        return
      }

      next()
      return
    }

    if (feature === 'therapy-booking') {
      if (user.plan === Plan.ULTIMATE) {
        next()
        return
      }

      if (user.plan === Plan.FREE) {
        res.status(403).json({ message: 'Upgrade required to book sessions' })
        return
      }

      const monthStart = startOfMonth(new Date())
      const nextMonth = new Date(monthStart)
      nextMonth.setMonth(monthStart.getMonth() + 1)

      const sessionCount = await prisma.appointment.count({
        where: {
          userId: user.id,
          datetime: { gte: monthStart, lt: nextMonth },
          status: { not: 'CANCELLED' },
        },
      })

      if (sessionCount >= 1) {
        res
          .status(403)
          .json({ message: 'Monthly therapy limit reached for Premium plan.' })
        return
      }

      next()
      return
    }

    next()
  }
}
