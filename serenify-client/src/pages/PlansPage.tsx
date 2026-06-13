import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import { api } from '../services/api'
import type { Invoice, SubscriptionInfo } from '../types/billing'
import { useAuthStore } from '../store/authStore'

type PlanCard = {
  id: 'free' | 'premium' | 'ultimate'
  title: string
  monthly: number
  annual: number
  features: string[]
  cta: string
  badge?: string
}

const plans: PlanCard[] = [
  {
    id: 'free',
    title: 'Free',
    monthly: 0,
    annual: 0,
    features: [
      '5 AI messages/day',
      '3 mind exercises',
      'Basic mood tracking',
      'Daily checklist',
      'No therapy sessions',
      'No progress reports',
    ],
    cta: 'Current Plan',
  },
  {
    id: 'premium',
    title: 'Premium',
    monthly: 999,
    annual: 799,
    features: [
      'Unlimited AI chat',
      'All 12+ exercises',
      'Full mood analytics',
      '1 therapy session/month',
      'Weekly progress report',
      'Priority support',
    ],
    cta: 'Upgrade Now',
    badge: 'Most Popular',
  },
  {
    id: 'ultimate',
    title: 'Ultimate',
    monthly: 1999,
    annual: 1599,
    features: [
      'Everything in Premium',
      '4 therapy sessions/month',
      'AI weekly insights',
      'Family sharing (3 members)',
      'Personal wellness plan',
    ],
    cta: 'Upgrade Now',
  },
]

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)

const formatInvoiceAmount = (amount: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)

export default function PlansPage() {
  const [activeTab, setActiveTab] = useState<'plans' | 'billing'>('plans')
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>(
    'monthly',
  )
  const user = useAuthStore((state) => state.user)
  const updateUser = useAuthStore((state) => state.updateUser)
  const [confirmPlan, setConfirmPlan] = useState<PlanCard | null>(null)

  const subscriptionQuery = useQuery({
    queryKey: ['billing-subscription'],
    queryFn: async () => {
      const { data } = await api.get<SubscriptionInfo>(
        '/billing/subscription',
      )
      return data
    },
  })

  const invoiceQuery = useQuery({
    queryKey: ['billing-invoices'],
    queryFn: async () => {
      const { data } = await api.get<{ invoices: Invoice[] }>('/billing/invoices')
      return data.invoices
    },
  })

  const checkoutMutation = useMutation({
    mutationFn: async (planId: 'premium' | 'ultimate') => {
      const { data } = await api.post<{
        success: boolean
        message: string
        plan: SubscriptionInfo['plan']
      }>(
        '/billing/create-checkout',
        { planId },
      )
      return data
    },
    onSuccess: (data) => {
      toast.success(`🎉 Successfully upgraded to ${data.plan}!`)
      if (user) {
        updateUser({ ...user, plan: data.plan })
      }
      void subscriptionQuery.refetch()
      void invoiceQuery.refetch()
      setConfirmPlan(null)
    },
    onError: () => toast.error('Unable to start checkout'),
  })

  const currentPlan = subscriptionQuery.data?.plan ?? 'FREE'
  const billingLoading = subscriptionQuery.isLoading || invoiceQuery.isLoading
  const billingError = subscriptionQuery.isError || invoiceQuery.isError

  const planCards = useMemo(() => {
    return plans.map((plan) => {
      const price = billingCycle === 'monthly' ? plan.monthly : plan.annual
      return {
        ...plan,
        priceLabel: `${formatPrice(price)}/month`,
      }
    })
  }, [billingCycle])

  return (
    <div
      className="rounded-[20px] p-6"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <PageHeader
        title="Plans & billing"
        subtitle="Choose the support level that fits your journey."
      />

      <div className="mb-6 flex flex-wrap gap-3">
        {['plans', 'billing'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab as 'plans' | 'billing')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab
                ? 'bg-[var(--accent-mint)] text-white'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {tab === 'plans' ? 'Plans' : 'Billing'}
          </button>
        ))}
      </div>

      {activeTab === 'plans' && (
        <div className="grid gap-6">
          <div className="flex items-center justify-between rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 shadow-[var(--card-shadow)]">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                billingCycle === 'monthly'
                  ? 'bg-[var(--accent-peach)] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                billingCycle === 'annual'
                  ? 'bg-[var(--accent-peach)] text-white'
                  : 'text-[var(--text-secondary)]'
              }`}
            >
              Annual (20% off)
            </button>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {planCards.map((plan) => {
              const isCurrent =
                (plan.id === 'free' && currentPlan === 'FREE') ||
                (plan.id === 'premium' && currentPlan === 'PREMIUM') ||
                (plan.id === 'ultimate' && currentPlan === 'ULTIMATE')

              const planBg =
                plan.id === 'premium'
                  ? 'bg-[var(--bg-card)]'
                  : plan.id === 'ultimate'
                    ? 'bg-[var(--bg-card)]'
                    : 'bg-[var(--bg-card)]'
              const planBorder =
                plan.id === 'premium'
                  ? 'border-[var(--accent-mint)]'
                  : plan.id === 'ultimate'
                    ? 'border-[var(--accent-lavender)]'
                    : 'border-[var(--border-color)]'
              const priceColor =
                plan.id === 'premium'
                  ? 'text-[var(--accent-mint)]'
                  : plan.id === 'ultimate'
                    ? 'text-[var(--accent-lavender)]'
                    : 'text-[var(--text-primary)]'

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col rounded-[20px] border-2 ${planBorder} ${planBg} p-6 shadow-[var(--card-shadow)]`}
                >
                  {plan.badge && (
                    <span className="absolute right-5 top-5 rounded-full bg-[var(--accent-mint)] px-3 py-1 text-[10px] font-semibold text-white">
                      {plan.badge}
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute left-5 top-5 rounded-full bg-[var(--sidebar-active)] px-3 py-1 text-[10px] font-semibold text-[var(--text-primary)]">
                      Current Plan
                    </span>
                  )}
                  <div className="mt-8">
                    <p className="text-lg font-semibold text-[var(--text-primary)]">
                      {plan.title}
                    </p>
                    <p className={`mt-2 text-3xl font-bold ${priceColor}`}>
                      {formatPrice(billingCycle === 'monthly' ? plan.monthly : plan.annual)}
                      <span className="text-sm font-medium text-[var(--text-secondary)]">
                        /month
                      </span>
                    </p>
                  </div>
                  <ul className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2">
                        <span className="text-[var(--accent-mint)]">✓</span>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    disabled={isCurrent || plan.id === 'free' || checkoutMutation.isPending}
                    onClick={() => plan.id !== 'free' && setConfirmPlan(plan)}
                    className={`mt-6 rounded-full px-4 py-3 text-sm font-semibold transition ${
                      isCurrent
                        ? 'border border-[var(--border-color)] text-[var(--text-secondary)]'
                        : 'bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] text-white'
                    }`}
                  >
                    {isCurrent ? 'Current Plan' : plan.cta}
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="grid gap-6">
          {billingLoading ? (
            <div className="grid gap-4">
              <div className="h-24 rounded-[20px] bg-[var(--bg-card)] animate-pulse" />
              <div className="h-48 rounded-[20px] bg-[var(--bg-card)] animate-pulse" />
            </div>
          ) : billingError ? (
            <div className="rounded-[20px] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--card-shadow)]">
              <p className="text-base font-semibold text-[var(--text-primary)]">
                Unable to load billing details.
              </p>
              <button
                type="button"
                onClick={() => {
                  void subscriptionQuery.refetch()
                  void invoiceQuery.refetch()
                }}
                className="mt-4 rounded-full bg-[var(--accent-mint)] px-4 py-2 text-xs font-semibold text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-[20px] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-[var(--text-muted)]">Current plan</p>
                    <p className="text-xl font-semibold text-[var(--text-primary)]">
                      {currentPlan}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      Status: {subscriptionQuery.data?.status ?? 'inactive'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void subscriptionQuery.refetch()
                      void invoiceQuery.refetch()
                    }}
                    className="rounded-full bg-[var(--accent-peach)] px-4 py-2 text-sm font-semibold text-white"
                  >
                    Refresh billing
                  </button>
                </div>
              </div>

              <div className="rounded-[20px] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Invoice history</p>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-[var(--text-secondary)]">
                    <thead className="text-xs uppercase text-[var(--text-muted)]">
                      <tr>
                        <th className="py-2">Date</th>
                        <th className="py-2">Description</th>
                        <th className="py-2">Amount</th>
                        <th className="py-2">Status</th>
                        <th className="py-2">Download</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceQuery.data?.length ? (
                        invoiceQuery.data.map((invoice) => (
                          <tr key={invoice.id} className="border-t border-[var(--border-color)]">
                            <td className="py-3">
                              {new Date(invoice.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3">Subscription</td>
                            <td className="py-3">
                              {formatInvoiceAmount(invoice.amount, invoice.currency)}
                            </td>
                            <td className="py-3">
                              <span
                                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                                  invoice.status === 'paid'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : invoice.status === 'failed'
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-amber-100 text-amber-700'
                                }`}
                              >
                                {invoice.status}
                              </span>
                            </td>
                            <td className="py-3">
                              {invoice.invoicePdf || invoice.hostedInvoiceUrl ? (
                                <a
                                  className="text-[var(--text-primary)] underline"
                                  href={invoice.invoicePdf ?? invoice.hostedInvoiceUrl ?? '#'}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  Download
                                </a>
                              ) : (
                                <span className="text-[var(--text-muted)]">Unavailable</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-[var(--text-muted)]">
                            No invoices yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {confirmPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-[20px] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Upgrade to {confirmPlan.title}
            </h3>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Upgrade to {confirmPlan.title} for{' '}
              {formatPrice(
                billingCycle === 'monthly' ? confirmPlan.monthly : confirmPlan.annual,
              )}
              /month?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmPlan(null)}
                className="rounded-full border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-secondary)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  checkoutMutation.mutate(confirmPlan.id as 'premium' | 'ultimate')
                }
                className="rounded-full bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] px-4 py-2 text-xs font-semibold text-white"
              >
                Confirm Upgrade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
