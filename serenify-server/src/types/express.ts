import type { Plan } from '@prisma/client'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        name: string
        email: string
        plan: Plan
      }
    }
  }
}

export {}
