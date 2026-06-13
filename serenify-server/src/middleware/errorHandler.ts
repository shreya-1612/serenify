import type { NextFunction, Request, Response } from 'express'

export type ApiError = {
  status?: number
  message?: string
}

export default function errorHandler(
  err: ApiError,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  const status = err.status ?? 500
  const message = err.message ?? 'Internal server error'
  res.status(status).json({ message })
}
