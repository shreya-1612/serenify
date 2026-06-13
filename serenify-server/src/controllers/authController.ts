import bcrypt from 'bcrypt'
import type { Request, Response } from 'express'
import { validationResult } from 'express-validator'
import type { ChecklistFrequency, Prisma } from '@prisma/client'
import prisma from '../utils/prisma'
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/jwt'
import { sendMail } from '../services/mailer'

const defaultChecklistItems: Array<{
  label: string
  emoji: string
  frequency: ChecklistFrequency
}> = [
  { label: 'Meditate for 10 minutes', emoji: '🧘', frequency: 'DAILY' },
  { label: 'Drink 8 glasses of water', emoji: '💧', frequency: 'DAILY' },
  { label: 'Write in journal', emoji: '📓', frequency: 'DAILY' },
  { label: 'Exercise for 30 minutes', emoji: '🏃', frequency: 'DAILY' },
  { label: 'Get 7-8 hours of sleep', emoji: '😴', frequency: 'DAILY' },
  { label: 'Practice gratitude', emoji: '🙏', frequency: 'DAILY' },
  { label: 'Limit screen time', emoji: '📵', frequency: 'DAILY' },
]

const getCookieOptions = () => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
})

const getExpiryDate = (exp?: number) => {
  if (!exp) {
    throw new Error('Missing token expiry')
  }
  return new Date(exp * 1000)
}

const buildAuthResponse = (user: {
  id: string
  name: string
  email: string
  plan: string
}) => ({
  user,
})

const ensureValid = (req: Request, res: Response) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() })
    return false
  }
  return true
}

export const signup = async (req: Request, res: Response) => {
  if (!ensureValid(req, res)) {
    return
  }

  const { name, email, password } = req.body as {
    name: string
    email: string
    password: string
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    res.status(409).json({ message: 'Email already registered' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      checklistItems: {
        createMany: {
          data: defaultChecklistItems.map(
            (item): Prisma.ChecklistItemCreateManyUserInput => ({
              ...item,
              isDefault: true,
              isActive: true,
              streak: 0,
            }),
          ),
        },
      },
    },
    select: { id: true, name: true, email: true, plan: true },
  })

  const payload = { sub: user.id, email: user.email }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  const refreshPayload = verifyRefreshToken(refreshToken)
  let expiresAt: Date
  try {
    expiresAt = getExpiryDate(refreshPayload.exp)
  } catch {
    res.status(500).json({ message: 'Invalid refresh token payload' })
    return
  }

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  })

  res.cookie('refreshToken', refreshToken, getCookieOptions())

  await sendMail({
    to: user.email,
    subject: 'Welcome to Serenify',
    html: `
      <div style="font-family:Arial,sans-serif;font-size:16px;color:#2D2D2D;">
        <h2>Welcome, ${user.name}!</h2>
        <p>Your Serenify space is ready. Start with a gentle check-in and build your first ritual.</p>
      </div>
    `,
  })

  res.status(201).json({
    ...buildAuthResponse(user),
    accessToken,
  })
}

export const login = async (req: Request, res: Response) => {
  if (!ensureValid(req, res)) {
    return
  }

  const { email, password } = req.body as { email: string; password: string }
  const userRecord = await prisma.user.findUnique({ where: { email } })

  if (!userRecord) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  const match = await bcrypt.compare(password, userRecord.passwordHash)
  if (!match) {
    res.status(401).json({ message: 'Invalid credentials' })
    return
  }

  const user = {
    id: userRecord.id,
    name: userRecord.name,
    email: userRecord.email,
    plan: userRecord.plan,
  }

  const payload = { sub: user.id, email: user.email }
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  const refreshPayload = verifyRefreshToken(refreshToken)
  let expiresAt: Date
  try {
    expiresAt = getExpiryDate(refreshPayload.exp)
  } catch {
    res.status(500).json({ message: 'Invalid refresh token payload' })
    return
  }

  await prisma.refreshToken.create({
    data: { userId: user.id, token: refreshToken, expiresAt },
  })

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  res.cookie('refreshToken', refreshToken, getCookieOptions())

  res.status(200).json({
    ...buildAuthResponse(user),
    accessToken,
  })
}

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.refreshToken as string | undefined
    console.log('Refresh attempt - cookie present:', Boolean(token))
    if (!token) {
      res.status(400).json({ error: 'No refresh token found', code: 'NO_REFRESH_TOKEN' })
      return
    }

    let payload: { sub?: string; id?: string; userId?: string; email?: string }
    try {
      payload = verifyRefreshToken(token)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid refresh token'
      console.log('Refresh token verification failed:', message)
      res
        .status(400)
        .json({ error: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' })
      return
    }

    const userId = payload.sub ?? payload.userId ?? payload.id
    if (!userId) {
      res.status(400).json({ error: 'User not found', code: 'USER_NOT_FOUND' })
      return
    }

    const stored = await prisma.refreshToken.findUnique({ where: { token } })
    if (!stored || stored.revokedAt) {
      res.status(400).json({ error: 'Refresh token revoked', code: 'REFRESH_REVOKED' })
      return
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      res.status(400).json({ error: 'Refresh token expired', code: 'REFRESH_EXPIRED' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, plan: true },
    })
    if (!user) {
      res.status(400).json({ error: 'User not found', code: 'USER_NOT_FOUND' })
      return
    }

    await prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    })

    const newPayload = { sub: user.id, email: user.email }
    const accessToken = signAccessToken(newPayload)
    const newRefreshToken = signRefreshToken(newPayload)
    const newRefreshPayload = verifyRefreshToken(newRefreshToken)
    let expiresAt: Date
    try {
      expiresAt = getExpiryDate(newRefreshPayload.exp)
    } catch {
      res.status(500).json({ message: 'Invalid refresh token payload' })
      return
    }

    await prisma.refreshToken.create({
      data: { userId: user.id, token: newRefreshToken, expiresAt },
    })

    res.cookie('refreshToken', newRefreshToken, getCookieOptions())

    res.status(200).json({
      ...buildAuthResponse(user),
      accessToken,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Token refresh failed'
    console.error('Refresh token error:', message)
    res.status(500).json({ error: 'Token refresh failed' })
  }
}

export const logout = async (req: Request, res: Response) => {
  const token = req.cookies?.refreshToken as string | undefined

  if (token) {
    await prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  res.clearCookie('refreshToken', getCookieOptions())
  res.status(200).json({ message: 'Logged out' })
}

export const forgotPassword = async (req: Request, res: Response) => {
  if (!ensureValid(req, res)) {
    return
  }

  const { email } = req.body as { email: string }
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(200).json({ message: 'If the email exists, an OTP has been sent.' })
    return
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  const otpHash = await bcrypt.hash(otp, 10)
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

  await prisma.passwordResetToken.create({
    data: { userId: user.id, otpHash, expiresAt },
  })

  await sendMail({
    to: user.email,
    subject: 'Your Serenify reset code',
    html: `
      <div style="font-family:Arial,sans-serif;font-size:16px;color:#2D2D2D;">
        <p>Use this code to reset your password:</p>
        <h2 style="letter-spacing:4px;">${otp}</h2>
        <p>This code expires in 15 minutes.</p>
      </div>
    `,
  })

  res.status(200).json({ message: 'OTP sent' })
}

export const resetPassword = async (req: Request, res: Response) => {
  if (!ensureValid(req, res)) {
    return
  }

  const { email, otp, password } = req.body as {
    email: string
    otp: string
    password: string
  }

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user) {
    res.status(400).json({ message: 'Invalid request' })
    return
  }

  const token = await prisma.passwordResetToken.findFirst({
    where: { userId: user.id, usedAt: null },
    orderBy: { createdAt: 'desc' },
  })

  if (!token || token.expiresAt.getTime() < Date.now()) {
    res.status(400).json({ message: 'OTP expired' })
    return
  }

  const isMatch = await bcrypt.compare(otp, token.otpHash)
  if (!isMatch) {
    res.status(400).json({ message: 'Invalid OTP' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  })

  await prisma.passwordResetToken.update({
    where: { id: token.id },
    data: { usedAt: new Date() },
  })

  res.status(200).json({ message: 'Password updated' })
}
