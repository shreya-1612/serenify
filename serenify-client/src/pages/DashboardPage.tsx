import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ArrowUpRight,
  Sparkles,
  MessageCircleHeart,
  BookHeart,
  Flame,
  CheckCircle2,
  Timer,
} from 'lucide-react'
import { api } from '../services/api'
import type { AxiosError } from 'axios'
import type { DashboardResponse } from '../types/dashboard'
import { useAuthStore } from '../store/authStore'

const moodOptions = [
  { label: 'Happy', value: 'HAPPY', emoji: '😊' },
  { label: 'Calm', value: 'CALM', emoji: '😌' },
  { label: 'Neutral', value: 'NEUTRAL', emoji: '😐' },
  { label: 'Sad', value: 'SAD', emoji: '😢' },
  { label: 'Anxious', value: 'ANXIOUS', emoji: '😠' },
] as const

const moodStyles: Record<string, { bg: string; ring: string }> = {
  HAPPY: { bg: '#E8F5F0', ring: '#3BBFA3' },
  CALM: { bg: '#F0EBF8', ring: '#8B6FBE' },
  NEUTRAL: { bg: '#FFF8E8', ring: '#F5A623' },
  SAD: { bg: '#E8F0F8', ring: '#4A90D9' },
  ANXIOUS: { bg: '#F8E8EC', ring: '#E85D75' },
}

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date)

const timeGreeting = (date: Date) => {
  const hour = date.getHours()
  if (hour < 12) return 'Good Morning'
  if (hour < 18) return 'Good Afternoon'
  return 'Good Evening'
}

const timeAgo = (dateString: string) => {
  const date = new Date(dateString)
  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export default function DashboardPage() {
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const [selectedMood, setSelectedMood] = useState<string | null>(null)

  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const { data } = await api.get<DashboardResponse>('/dashboard')
        return data
      } catch (error) {
        const axiosError = error as AxiosError
        console.error('Dashboard fetch error:', axiosError.response?.data)
        throw error
      }
    },
  })

  const logMoodMutation = useMutation({
    mutationFn: async (mood: string) => {
      const { data } = await api.post('/mood', { mood })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
  })

  const dashboard = dashboardQuery.data
  const todayMood = dashboard?.todaysMood?.mood ?? null
  const checklistPercent = dashboard
    ? dashboard.checklistSummary.total === 0
      ? 0
      : Math.round(
          (dashboard.checklistSummary.completed /
            dashboard.checklistSummary.total) *
            100,
        )
    : 0

  if (dashboardQuery.isLoading) {
    return (
      <div className="grid gap-6">
        <div className="h-28 rounded-[20px] bg-[var(--bg-card)] animate-pulse" />
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="h-40 rounded-[20px] bg-[var(--bg-card)] animate-pulse" />
          <div className="h-40 rounded-[20px] bg-[var(--bg-card)] animate-pulse" />
          <div className="h-40 rounded-[20px] bg-[var(--bg-card)] animate-pulse" />
        </div>
        <div className="h-64 rounded-[20px] bg-[var(--bg-card)] animate-pulse" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--card-shadow)]">
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          Sign in to view your dashboard.
        </p>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Your latest moods, streaks, and check-ins will appear here.
        </p>
      </div>
    )
  }

  if (dashboardQuery.isError || !dashboard) {
    return (
      <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-8 text-center shadow-[var(--card-shadow)]">
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          We couldn't load your dashboard.
        </p>
        <button
          type="button"
          className="mt-4 rounded-full bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] px-5 py-2 text-sm font-semibold text-white"
          onClick={() => dashboardQuery.refetch()}
        >
          Retry
        </button>
      </div>
    )
  }

  const greeting = `${timeGreeting(new Date())}, ${user?.name?.split(' ')[0] ?? 'Friend'} 👋`

  const checklistCompleted = dashboard.checklistSummary.completed
  const checklistTotal = dashboard.checklistSummary.total

  const quickStats = [
    {
      label: 'Streak',
      value: `${dashboard.user.streak} days`,
      icon: Flame,
      accent: '#F5A623',
    },
    {
      label: 'Sessions',
      value: dashboard.weeklyStats.sessionCount,
      icon: Sparkles,
      accent: '#3BBFA3',
    },
    {
      label: 'Tasks',
      value: `${checklistCompleted}/${checklistTotal}`,
      icon: CheckCircle2,
      accent: '#8B6FBE',
    },
    {
      label: 'Minutes',
      value: dashboard.weeklyStats.minutesMeditated,
      icon: Timer,
      accent: '#4A90D9',
    },
  ]

  const quickAccess = [
    {
      title: 'Start Exercise',
      subtitle: 'Guided routines',
      icon: Sparkles,
      to: '/exercises',
      color: '#3BBFA3',
    },
    {
      title: 'Talk to Serenity',
      subtitle: 'Supportive chat',
      icon: MessageCircleHeart,
      to: '/chat',
      color: '#8B6FBE',
    },
    {
      title: 'Book Therapy',
      subtitle: 'Find the right fit',
      icon: BookHeart,
      to: '/therapy',
      color: '#F5A623',
    },
  ]

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="grid gap-6"
      style={{
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        padding: '24px',
      }}
    >
      <motion.section
        variants={itemVariants}
        className="grid gap-6 rounded-[24px] bg-[linear-gradient(135deg,_#667EEA_0%,_#764BA2_100%)] p-8 text-white shadow-[var(--card-shadow)] md:grid-cols-[1.2fr_0.8fr]"
      >
        <div>
          <p className="text-2xl font-semibold">{greeting}</p>
          <p className="mt-2 text-sm text-white/80">{formatDate(new Date())}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-xs font-semibold">
            🔥 {dashboard.user.streak} day streak
          </div>
        </div>
        <div className="flex items-center justify-center md:justify-end">
          <svg viewBox="0 0 220 180" className="h-36 w-full max-w-[220px]">
            <defs>
              <linearGradient id="meditateGlow" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.2" />
              </linearGradient>
            </defs>
            <circle cx="110" cy="90" r="70" fill="url(#meditateGlow)" />
            <circle cx="110" cy="62" r="18" fill="#FFFFFF" />
            <path d="M78 118 C92 92 128 92 142 118" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
            <path d="M62 140 C82 132 94 132 110 132 C126 132 138 132 158 140" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
            <path d="M80 144 C90 162 130 162 140 144" fill="none" stroke="#FFFFFF" strokeWidth="10" strokeLinecap="round" />
          </svg>
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
          <p className="text-sm font-semibold text-[var(--text-primary)]">How are you feeling today?</p>
          {todayMood ? (
            <div className="mt-4 rounded-xl bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              You felt {todayMood.toLowerCase()} today ✓
            </div>
          ) : (
            <div className="mt-5 flex flex-wrap gap-3">
              {moodOptions.map((mood) => {
                const style = moodStyles[mood.value]
                const isSelected = selectedMood === mood.value
                return (
                  <button
                    key={mood.value}
                    type="button"
                    onClick={() => setSelectedMood(mood.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl px-3 py-3 text-xs font-semibold transition ${
                      isSelected ? 'scale-105' : ''
                    }`}
                    style={{
                      background: style.bg,
                      boxShadow: isSelected
                        ? `0 0 0 2px ${style.ring}`
                        : '0 0 0 1px rgba(0,0,0,0.08)',
                    }}
                  >
                    <span className="text-xl">{mood.emoji}</span>
                    <span className="text-[var(--text-primary)]">{mood.label}</span>
                  </button>
                )
              })}
            </div>
          )}
          {!todayMood && (
            <button
              type="button"
              className="mt-5 w-full rounded-full bg-[linear-gradient(135deg,_#3BBFA3,_#2DA58B)] px-4 py-3 text-sm font-semibold text-white"
              onClick={() => selectedMood && logMoodMutation.mutate(selectedMood)}
              disabled={!selectedMood || logMoodMutation.isPending}
            >
              {logMoodMutation.isPending ? 'Saving...' : 'Log mood'}
            </button>
          )}
        </div>

        <div className="grid gap-4">
          {quickStats.map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-4 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-full"
                style={{ background: `${stat.accent}20` }}
              >
                <stat.icon size={18} style={{ color: stat.accent }} />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--text-primary)]">
                  {stat.value}
                </p>
                <p className="text-[13px] text-[var(--text-muted)]">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

      <motion.section variants={itemVariants} className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
          <p className="text-sm font-semibold text-[var(--text-primary)]">Daily Goal</p>
          <div className="mt-6 flex flex-col items-center">
            <div className="relative flex h-[180px] w-[180px] items-center justify-center">
              <svg width="180" height="180" className="-rotate-90">
                <circle
                  cx="90"
                  cy="90"
                  r="70"
                  stroke="rgba(59,191,163,0.15)"
                  strokeWidth="12"
                  fill="none"
                />
                <motion.circle
                  cx="90"
                  cy="90"
                  r="70"
                  stroke="var(--accent-mint)"
                  strokeWidth="12"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={2 * Math.PI * 70 * (1 - checklistPercent / 100)}
                  initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - checklistPercent / 100) }}
                  transition={{ duration: 1.2 }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-3xl font-bold text-[var(--text-primary)]">
                  {checklistPercent}%
                </p>
                <p className="text-xs text-[var(--text-muted)]">Complete</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {checklistCompleted} of {checklistTotal} tasks complete
            </p>
          </div>
        </div>

        <div className="grid gap-4">
          <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Quick Access</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {quickAccess.map((card) => (
                <a
                  key={card.title}
                  href={card.to}
                  className="group relative flex flex-col gap-3 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4 transition hover:-translate-y-1 hover:shadow-[var(--card-shadow-hover)]"
                >
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: `${card.color}22` }}
                  >
                    <card.icon size={18} style={{ color: card.color }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {card.title}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">{card.subtitle}</p>
                  </div>
                  <ArrowUpRight
                    size={16}
                    className="absolute right-4 top-4 text-[var(--text-muted)]"
                  />
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-[20px] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
            <p className="text-sm font-semibold text-[var(--text-primary)]">Recent Activity</p>
            <div className="mt-4 space-y-3">
              {dashboard.recentActivity.length === 0 ? (
                <div className="rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-muted)]">
                  No activity yet. Log a mood or complete an exercise.
                </div>
              ) : (
                dashboard.recentActivity.map((item, index) => (
                  <div
                    key={`${item.type}-${index}`}
                    className="flex items-center justify-between rounded-[12px] border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background:
                            item.type === 'exercise'
                              ? '#3BBFA3'
                              : item.type === 'chat'
                                ? '#8B6FBE'
                                : '#F5A623',
                        }}
                      />
                      <span className="text-[var(--text-secondary)]">{item.label}</span>
                    </div>
                    <span className="text-xs text-[var(--text-muted)]">
                      {timeAgo(item.at)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </motion.section>
    </motion.div>
  )
}
