import type { Request, Response } from 'express'
import { Plan } from '@prisma/client'
import prisma from '../utils/prisma'

type PlanId = 'premium' | 'ultimate'

type PlanDetails = {
  name: Plan
  price: number
}

const planDetails: Record<PlanId, PlanDetails> = {
  premium: { name: Plan.PREMIUM, price: 1299 },
  ultimate: { name: Plan.ULTIMATE, price: 2499 },
}

export const createCheckout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { planId } = req.body as { planId?: PlanId }
    if (!planId || !planDetails[planId]) {
      res.status(400).json({ error: 'Invalid plan' })
      return
    }

    const plan = planDetails[planId]

    await prisma.user.update({
      where: { id: userId },
      data: { plan: plan.name },
    })

    await prisma.invoice.create({
      data: {
        userId,
        amount: plan.price,
        currency: 'INR',
        status: 'paid',
        stripeInvoiceId: `mock_${Date.now()}`,
      },
    })

    res.json({
      success: true,
      message: `Successfully upgraded to ${plan.name} plan`,
      plan: plan.name,
    })
  } catch (error: any) {
    console.error('checkout error:', error?.message || error)
    res.status(500).json({ error: 'Checkout failed', details: error?.message })
  }
}

export const getSubscription = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    })

    res.json({
      plan: user?.plan ?? Plan.FREE,
      status: 'active',
      currentPeriodEnd: null,
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get subscription' })
  }
}

export const getInvoices = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const invoices = await prisma.invoice.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    })

    res.json({ invoices })
  } catch (error) {
    res.status(500).json({ error: 'Failed to get invoices' })
  }
}

export const handleStripeWebhook = async (_req: Request, res: Response) => {
  res.json({ received: true })
}
