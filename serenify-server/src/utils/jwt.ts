import jwt, { type Secret, type SignOptions } from 'jsonwebtoken'

const accessSecret = process.env.JWT_SECRET
const refreshSecret = process.env.JWT_REFRESH_SECRET

if (!accessSecret || !refreshSecret) {
  throw new Error(
    'FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables. ' +
      'Server cannot start without them.',
  )
}

const accessExpiry =
  (process.env.ACCESS_TOKEN_EXPIRY ?? '15m') as SignOptions['expiresIn']
const refreshExpiry =
  (process.env.REFRESH_TOKEN_EXPIRY ?? '7d') as SignOptions['expiresIn']

export type JwtPayload = {
  sub: string
  email: string
  exp?: number
}

export const signAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, accessSecret as Secret, { expiresIn: accessExpiry })

export const signRefreshToken = (payload: JwtPayload) =>
  jwt.sign(payload, refreshSecret as Secret, { expiresIn: refreshExpiry })

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, accessSecret as Secret) as JwtPayload

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, refreshSecret as Secret) as JwtPayload
