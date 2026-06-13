import bcrypt from 'bcrypt'
import type { Request, Response } from 'express'
import prisma from '../utils/prisma'

const passwordRule = /^(?=.*[A-Z])(?=.*\d).{8,}$/

type NotificationPrefs = {
  dailyCheckIn: boolean
  appointmentReminders: boolean
  weeklyProgress: boolean
  tipOfTheDay: boolean
}

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        avatar: true,
        streak: true,
        createdAt: true,
        reminderTime: true,
        notificationPrefs: true,
      },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    res.status(200).json({ user })
  } catch (error) {
    console.error('getProfile error:', error)
    res.status(500).json({ error: 'Failed to load profile' })
  }
}

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { name, avatar, reminderTime, notificationPrefs } = req.body as {
      name?: string
      avatar?: string | null
      reminderTime?: string
      notificationPrefs?: NotificationPrefs
    }

    const data: {
      name?: string
      avatar?: string | null
      reminderTime?: string | null
      notificationPrefs?: NotificationPrefs
    } = {}

    if (name) {
      data.name = name.trim()
    }

    if (typeof avatar === 'string' || avatar === null) {
      data.avatar = avatar
    }

    if (typeof reminderTime === 'string') {
      data.reminderTime = reminderTime
    }

    if (notificationPrefs) {
      data.notificationPrefs = notificationPrefs
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        plan: true,
        avatar: true,
        streak: true,
        createdAt: true,
        reminderTime: true,
        notificationPrefs: true,
      },
    })

    res.status(200).json({ user })
  } catch (error) {
    console.error('updateProfile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string
      newPassword?: string
    }

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Missing password fields' })
      return
    }

    if (!passwordRule.test(newPassword)) {
      res.status(400).json({
        error: 'Password must be 8+ chars with uppercase and number',
      })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    })

    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }

    const matches = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!matches) {
      res.status(400).json({ error: 'Current password is incorrect' })
      return
    }

    const nextHash = await bcrypt.hash(newPassword, 12)
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: nextHash },
    })

    res.status(200).json({ message: 'Password changed successfully' })
  } catch (error) {
    console.error('changePassword error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
}

export const deleteAccount = async (req: Request, res: Response) => {
  const userId = req.user?.id
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' })
    return
  }

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  })

  await prisma.refreshToken.updateMany({
    where: { userId },
    data: { revokedAt: new Date() },
  })

  res.status(200).json({ message: 'Account deleted' })
}
