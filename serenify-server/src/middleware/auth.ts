import type { NextFunction, Request, Response } from 'express'
import type { Plan } from '@prisma/client'
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken'
import prisma from '../utils/prisma'
import { verifyAccessToken } from '../utils/jwt'

export default async function auth(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization
  const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined

  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }

  try {
    let payload
    try {
      payload = verifyAccessToken(token)
    } catch (tokenError) {
      if (tokenError instanceof TokenExpiredError) {
        return res.status(401).json({ error: 'Token expired', code: 'TOKEN_EXPIRED' })
      }
      if (tokenError instanceof JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid token', code: 'INVALID_TOKEN' })
      }
      console.error('Unexpected auth error:', tokenError)
      return res.status(401).json({ error: 'Authentication failed' })
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, plan: true, deletedAt: true },
    })

    if (!user || user.deletedAt) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const reqWithUser = req as Request & {
      user?: {
        id: string
        name: string
        email: string
        plan: Plan
      }
    }
    reqWithUser.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      plan: user.plan,
    }
    return next()
  } catch (error) {
    console.error('Auth middleware server error:', error)
    return res.status(500).json({ error: 'Internal server error during auth' })
  }
}
