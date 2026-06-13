import cron from 'node-cron'
import prisma from '../utils/prisma'

const startOfUtcDay = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + days)
  return next
}

export const startChecklistResetJob = () => {
  cron.schedule(
    '0 0 * * *',
    async () => {
      const todayStart = startOfUtcDay(new Date())
      const yesterdayStart = addUtcDays(todayStart, -1)

      const completedYesterday = await prisma.checklistLog.findMany({
        where: {
          completedAt: { gte: yesterdayStart, lt: todayStart },
        },
        select: { itemId: true },
      })

      const completedSet = new Set(completedYesterday.map((log) => log.itemId))

      const items = await prisma.checklistItem.findMany({
        where: { streak: { gt: 0 } },
        select: { id: true },
      })

      const updates = items
        .filter((item) => !completedSet.has(item.id))
        .map((item) =>
          prisma.checklistItem.update({
            where: { id: item.id },
            data: { streak: 0 },
          }),
        )

      if (updates.length > 0) {
        await prisma.$transaction(updates)
      }
    },
    { timezone: 'UTC' },
  )
}
