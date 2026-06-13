export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' | 'inactive'

export type PlanTier = 'FREE' | 'PREMIUM' | 'ULTIMATE'

export type SubscriptionInfo = {
  plan: PlanTier
  status: SubscriptionStatus
  currentPeriodEnd: string | null
}

export type Invoice = {
  id: string
  amount: number
  currency: string
  status: string
  stripeInvoiceId: string
  createdAt: string
  hostedInvoiceUrl?: string | null
  invoicePdf?: string | null
}
