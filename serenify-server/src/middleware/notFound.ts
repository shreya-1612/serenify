import type { Request, Response } from 'express'

export default function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: 'Route not found' })
}
