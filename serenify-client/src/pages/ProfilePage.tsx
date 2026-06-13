import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Camera,
  Check,
  ChevronDown,
  ChevronUp,
  Heart,
  MessageCircle,
  Settings,
  Smile,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'
import type { ChatSession } from '../types/chat'
import type { ChecklistResponse } from '../types/checklist'
import type { ProgressWeekly } from '../types/progress'
import type { UserProfile } from '../types/profile'
import type { Appointment } from '../types/therapy'
import {
  backgroundThemeOptions,
  initializeBackgroundTheme,
  setBackgroundTheme,
  type BackgroundThemeName,
} from '../utils/backgroundTheme'
import './ProfilePage.css'

const STAR_SYMBOL = '\u2726'

const EMOJI = {
  HAPPY: '\u{1F60A}',
  CALM: '\u{1F60C}',
  NEUTRAL: '\u{1F610}',
  SAD: '\u{1F614}',
  ANXIOUS: '\u{1F630}',
  FIRE: '\u{1F525}',
  PURPLE_HEART: '\u{1F49C}',
}

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const

const JOURNAL_PROMPTS = [
  'What emotion needs the most kindness from you today?',
  'Which thought kept circling in your mind, and what does it need?',
  'What is one tiny win from today that you can celebrate?',
  'If your body could speak right now, what would it ask for?',
  'What boundary would make this week feel lighter?',
  'What are you holding onto that you can release tonight?',
]

const EMPTY_PROGRESS: ProgressWeekly = {
  moodBreakdown: {
    HAPPY: 0,
    CALM: 0,
    NEUTRAL: 0,
    SAD: 0,
    ANXIOUS: 0,
  },
  moodTrend: WEEK_DAYS.map((day) => ({ day, score: null })),
  exerciseByDay: WEEK_DAYS.map((day) => ({ day, minutes: 0 })),
  checklistRate: 0,
  checklistCompletions: 0,
  totalExercises: 0,
  totalMoodLogs: 0,
  minutesMeditated: 0,
}

const EMPTY_CHECKLIST: ChecklistResponse = {
  date: '',
  total: 0,
  completed: 0,
  items: [],
}

const moodLookup: Record<number, { label: string; emoji: string }> = {
  1: { label: 'Anxious', emoji: EMOJI.ANXIOUS },
  2: { label: 'Sad', emoji: EMOJI.SAD },
  3: { label: 'Neutral', emoji: EMOJI.NEUTRAL },
  4: { label: 'Calm', emoji: EMOJI.CALM },
  5: { label: 'Happy', emoji: EMOJI.HAPPY },
}

const getInitials = (name: string) => {
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')

  return initials || 'SF'
}

const getMoodFromScore = (score: number | null | undefined) => {
  if (typeof score !== 'number') return null
  return moodLookup[score] ?? null
}

const getPasswordStrength = (password: string) => {
  if (!password) {
    return { label: 'Weak', percent: 0, color: 'var(--border-color)' }
  }

  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password)) score += 1
  if (/[0-9]/.test(password)) score += 1
  if (/[^A-Za-z0-9]/.test(password)) score += 1

  if (score <= 1) return { label: 'Weak', percent: 30, color: 'var(--text-muted)' }
  if (score === 2) return { label: 'Fair', percent: 60, color: 'var(--accent-peach)' }
  if (score === 3) return { label: 'Good', percent: 80, color: 'var(--accent-lavender)' }

  return { label: 'Strong', percent: 100, color: 'var(--accent-mint)' }
}

const formatAppointment = (datetime: string) => {
  const date = new Date(datetime)
  if (Number.isNaN(date.getTime())) return 'Schedule unavailable'

  return date.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const pickDailyPrompt = (seed: string) => {
  let hash = 0
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index)
    hash |= 0
  }
  return JOURNAL_PROMPTS[Math.abs(hash) % JOURNAL_PROMPTS.length]
}

function Skeleton({ className }: { className: string }) {
  return <div className={`profile-skeleton ${className}`} />
}

export default function ProfilePage() {
  const queryClient = useQueryClient()
  const updateUser = useAuthStore((state) => state.updateUser)
  const authUser = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const themeMode = useThemeStore((state) => state.theme)
  const setThemeMode = useThemeStore((state) => state.setTheme)

  const heroAvatarInputRef = useRef<HTMLInputElement | null>(null)
  const modalAvatarInputRef = useRef<HTMLInputElement | null>(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isPasswordSectionOpen, setIsPasswordSectionOpen] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [displayNameDraft, setDisplayNameDraft] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [selectedBackgroundTheme, setSelectedBackgroundTheme] =
    useState<BackgroundThemeName>('serenify')
  const [hoveredTheme, setHoveredTheme] = useState<BackgroundThemeName | null>(null)

  const profileQuery = useQuery<UserProfile>({
    queryKey: ['profile'],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<{ user: UserProfile }>('/user/profile')
      return data.user
    },
  })

  const progressQuery = useQuery<ProgressWeekly>({
    queryKey: ['progress-weekly'],
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<ProgressWeekly>('/progress/weekly')
      return data
    },
  })

  const checklistQuery = useQuery<ChecklistResponse>({
    queryKey: ['checklist'],
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<ChecklistResponse>('/checklist')
      return data
    },
  })

  const chatSessionsQuery = useQuery<ChatSession[]>({
    queryKey: ['chat-sessions'],
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<ChatSession[] | { sessions: ChatSession[] }>(
        '/chat/sessions',
      )

      if (Array.isArray(data)) return data
      if (Array.isArray(data.sessions)) return data.sessions
      return []
    },
  })

  const upcomingAppointmentsQuery = useQuery<Appointment[]>({
    queryKey: ['appointments', 'upcoming'],
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await api.get<{ appointments: Appointment[] }>(
        '/appointments',
        {
          params: { status: 'upcoming' },
        },
      )
      return data.appointments ?? []
    },
  })

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { name: string; avatar: string | null }) => {
      const { data } = await api.patch<{ user: UserProfile }>(
        '/user/profile',
        payload,
      )
      return data.user
    },
    onSuccess: (nextUser) => {
      updateUser({
        id: nextUser.id,
        name: nextUser.name,
        email: nextUser.email,
        plan: nextUser.plan,
        avatar: nextUser.avatar,
        onboarding: authUser?.onboarding,
      })
      setNameDraft(nextUser.name)
      setAvatarPreview(nextUser.avatar)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated')
      setIsEditModalOpen(false)
    },
    onError: () => {
      toast.error('Unable to update profile')
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      await api.post('/user/change-password', {
        currentPassword,
        newPassword,
      })
    },
    onSuccess: () => {
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setIsPasswordSectionOpen(false)
      toast.success('Password updated')
    },
    onError: () => {
      toast.error('Unable to update password')
    },
  })

  const profile = profileQuery.data ?? null
  const progress = progressQuery.data ?? EMPTY_PROGRESS
  const checklist = checklistQuery.data ?? EMPTY_CHECKLIST

  const profileId = profile?.id ?? authUser?.id ?? ''
  const displayNameStorageKey = profileId
    ? `serenify.profile.displayName.${profileId}`
    : ''

  useEffect(() => {
    if (!isEditModalOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsEditModalOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isEditModalOpen])

  useEffect(() => {
    const activeTheme = initializeBackgroundTheme()
    setSelectedBackgroundTheme(activeTheme)
  }, [])

  const dateSeed = useMemo(() => new Date().toISOString().slice(0, 10), [])
  const promptOfTheDay = useMemo(() => {
    return pickDailyPrompt(`${profileId}:${dateSeed}`)
  }, [profileId, dateSeed])

  const effectiveName = profile?.name ?? authUser?.name ?? 'Serenify Friend'
  const effectiveAvatar = avatarPreview ?? profile?.avatar ?? authUser?.avatar ?? null
  const displayName = displayNameDraft.trim() || effectiveName
  const streak = profile?.streak ?? 0
  const moodToday = getMoodFromScore(progress.moodTrend.at(-1)?.score)
  const moodLine = moodToday
    ? `Feeling: ${moodToday.emoji} ${moodToday.label}`
    : `Log your mood today ${EMOJI.HAPPY}`

  const memberSince = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : ''

  const passwordStrength = useMemo(
    () => getPasswordStrength(newPassword),
    [newPassword],
  )

  const selectedThemeMeta = useMemo(() => {
    return (
      backgroundThemeOptions.find(
        (themeOption) => themeOption.key === selectedBackgroundTheme,
      ) ?? backgroundThemeOptions[0]
    )
  }, [selectedBackgroundTheme])

  const conversationsCount = chatSessionsQuery.data?.length ?? 0
  const upcomingSession = upcomingAppointmentsQuery.data?.[0] ?? null
  const checklistRaw =
    typeof progress.checklistCompletions === 'number'
      ? progress.checklistCompletions
      : progress.checklistRate
  const weeklyChecklistPercent = Math.max(
    0,
    Math.min(100, Math.round(checklistRaw ?? 0)),
  )

  const moodChartHasData = progress.moodTrend.some(
    (point) => typeof point.score === 'number',
  )

  const hasDataErrors =
    profileQuery.isError ||
    progressQuery.isError ||
    checklistQuery.isError ||
    chatSessionsQuery.isError ||
    upcomingAppointmentsQuery.isError

  const openEditProfileModal = () => {
    const initialName = profile?.name ?? authUser?.name ?? ''
    const initialAvatar = avatarPreview ?? profile?.avatar ?? authUser?.avatar ?? null
    const fallbackDisplayName =
      (profile?.name ?? authUser?.name ?? 'Serenify').split(' ')[0] || 'Serenify'
    const savedDisplayName = displayNameStorageKey
      ? window.localStorage.getItem(displayNameStorageKey)
      : null

    setNameDraft(initialName)
    setAvatarPreview(initialAvatar)
    setDisplayNameDraft(savedDisplayName ?? fallbackDisplayName)
    setIsEditModalOpen(true)
  }

  const handleAvatarFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        toast.error('Unable to read selected image')
        return
      }
      setAvatarPreview(result)
    }
    reader.onerror = () => toast.error('Unable to read selected image')
    reader.readAsDataURL(file)
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0]
    if (nextFile) {
      handleAvatarFile(nextFile)
    }
    event.target.value = ''
  }

  const handleSaveProfile = () => {
    const trimmedName = nameDraft.trim()
    const trimmedDisplayName = displayNameDraft.trim()

    if (!trimmedName) {
      toast.error('Full name is required')
      return
    }

    if (!trimmedDisplayName) {
      toast.error('Display name is required')
      return
    }

    if (displayNameStorageKey) {
      window.localStorage.setItem(displayNameStorageKey, trimmedDisplayName)
    }

    updateProfileMutation.mutate({
      name: trimmedName,
      avatar: avatarPreview,
    })
  }

  const handleSavePassword = () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Fill all password fields')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }

    changePasswordMutation.mutate()
  }

  const handleBackgroundThemeSelect = (themeName: BackgroundThemeName) => {
    setSelectedBackgroundTheme(themeName)
    setBackgroundTheme(themeName)
    setThemeMode(themeName)
  }

  if (!isAuthenticated) {
    return (
      <div className="profile-card text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">
          Sign in to view your profile.
        </p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Your personalized dashboard appears here after login.
        </p>
      </div>
    )
  }

  return (
    <div className="profile-redesign-page space-y-6">
      <section className="profile-hero">
        <div className="profile-hero-decoration">
          <span className="profile-sparkle profile-sparkle-top-left">{STAR_SYMBOL}</span>
          <span className="profile-sparkle profile-sparkle-bottom-right">
            {STAR_SYMBOL}
          </span>
          <span className="profile-particle" />
          <span className="profile-particle" />
          <span className="profile-particle" />
          <span className="profile-particle" />
          <span className="profile-particle" />
          <span className="profile-particle" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-4">
            <div className="relative">
              <button
                type="button"
                onClick={() => heroAvatarInputRef.current?.click()}
                className="profile-avatar-button"
                aria-label="Change profile avatar"
              >
                {effectiveAvatar ? (
                  <img
                    src={effectiveAvatar}
                    alt={effectiveName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="profile-avatar-initials">{getInitials(effectiveName)}</span>
                )}
                <span className="profile-avatar-overlay">
                  <Camera size={14} />
                  <span>Change</span>
                </span>
              </button>
              <input
                ref={heroAvatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div>
              {profileQuery.isLoading ? (
                <>
                  <Skeleton className="h-6 w-44 rounded-lg" />
                  <Skeleton className="mt-2 h-4 w-52 rounded-lg" />
                </>
              ) : (
                <>
                  <h1 className="text-[20px] font-bold text-white">{displayName}</h1>
                  <p className="mt-1 text-sm text-white/90">{moodLine}</p>
                </>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-[var(--accent-peach)] px-3 py-1 text-xs font-semibold text-white">
                  {EMOJI.FIRE} {streak} Day Streak
                </span>
                {memberSince ? (
                  <span className="text-xs text-white/80">Member since {memberSince}</span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={openEditProfileModal}
              className="profile-edit-button"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={() => toast('Profile settings are in Edit Profile.')}
              className="profile-settings-button"
              aria-label="Open profile settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>
      </section>

      {hasDataErrors ? (
        <p className="text-xs text-[var(--text-secondary)]">
          Some live data is unavailable right now. Available stats are still shown.
        </p>
      ) : null}

      <section className="grid grid-cols-2 gap-4">
        <article className="profile-card profile-elevate">
          <div className="profile-icon-shell border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--accent-mint)]">
            <BookOpen size={18} />
          </div>
          <h3 className="profile-stat-label mt-3 text-base font-bold text-[var(--text-primary)]">
            Mind Exercises
          </h3>
          {progressQuery.isLoading ? (
            <Skeleton className="mt-2 h-6 w-24 rounded-lg" />
          ) : (
            <p className="mt-2 text-lg font-semibold text-[var(--accent-mint)]">
              {progress.totalExercises} Sessions
            </p>
          )}
          <Link to="/exercises" className="profile-action-link profile-link-outline-mint">
            Start Session -&gt;
          </Link>
        </article>

        <article className="profile-card profile-elevate">
          <div className="profile-icon-shell border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--accent-lavender)]">
            <Smile size={18} />
          </div>
          <h3 className="profile-stat-label mt-3 text-base font-bold text-[var(--text-primary)]">
            Mood Tracker
          </h3>
          {progressQuery.isLoading ? (
            <Skeleton className="mt-2 h-6 w-24 rounded-lg" />
          ) : (
            <p className="mt-2 text-lg font-semibold text-[var(--accent-lavender)]">
              {moodToday ? `${moodToday.emoji} ${moodToday.label}` : 'Not logged'}
            </p>
          )}
          <Link to="/dashboard" className="profile-action-link profile-link-fill-lavender">
            Track Mood -&gt;
          </Link>
        </article>

        <article className="profile-card profile-elevate">
          <div className="profile-icon-shell border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--accent-peach)]">
            <MessageCircle size={18} />
          </div>
          <h3 className="profile-stat-label mt-3 text-base font-bold text-[var(--text-primary)]">
            Serenity AI
          </h3>
          {chatSessionsQuery.isLoading ? (
            <Skeleton className="mt-2 h-6 w-24 rounded-lg" />
          ) : (
            <p className="mt-2 text-lg font-semibold text-[var(--accent-peach)]">
              {conversationsCount} Conversations
            </p>
          )}
          <Link to="/chat" className="profile-action-link profile-link-outline-peach">
            Chat Now -&gt;
          </Link>
        </article>

        <article className="profile-card profile-elevate">
          <div className="profile-icon-shell border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--sidebar-active-text)]">
            <Target size={18} />
          </div>
          <h3 className="profile-stat-label mt-3 text-base font-bold text-[var(--text-primary)]">
            Daily Checklist
          </h3>
          {checklistQuery.isLoading ? (
            <Skeleton className="mt-2 h-6 w-24 rounded-lg" />
          ) : (
            <p className="mt-2 text-lg font-semibold text-[var(--sidebar-active-text)]">
              {checklist.completed}/{checklist.total} Tasks Done
            </p>
          )}
          <Link to="/checklist" className="profile-action-link profile-link-outline-blue">
            View Goals -&gt;
          </Link>
        </article>
      </section>

      <section className="profile-card profile-ambiance-card profile-elevate">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="profile-section-title text-base font-bold text-[var(--text-primary)]">
            Ambiance <span aria-hidden="true">🎨</span>
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {themeMode === 'midnight'
              ? 'Midnight Zen is recommended in dark mode'
              : 'Choose a calming page background'}
          </p>
        </div>

        <div className="profile-theme-picker mt-4" role="radiogroup" aria-label="Page theme">
          {backgroundThemeOptions.map((themeOption) => {
            const isSelected = selectedBackgroundTheme === themeOption.key
            const isBestInLight =
              themeMode === 'midnight' && themeOption.key !== 'midnight'
            const tooltipText = isBestInLight
              ? `${themeOption.name} - Best in light mode`
              : themeOption.name

            return (
              <button
                key={themeOption.key}
                type="button"
                onClick={() => handleBackgroundThemeSelect(themeOption.key)}
                onMouseEnter={() => setHoveredTheme(themeOption.key)}
                onMouseLeave={() => setHoveredTheme(null)}
                className={`profile-theme-dot ${isSelected ? 'is-selected' : ''}`}
                style={{ background: themeOption.gradient }}
                title={tooltipText}
                aria-label={tooltipText}
                aria-pressed={isSelected}
              >
                {isSelected ? (
                  <span className="profile-theme-check" aria-hidden="true">
                    <Check size={16} />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>

        <p className="profile-theme-selected mt-3">{selectedThemeMeta.name}</p>
        {themeMode === 'midnight' && hoveredTheme && hoveredTheme !== 'midnight' ? (
          <p className="profile-theme-note">Best in light mode</p>
        ) : null}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="profile-card relative overflow-hidden">
          <Heart className="absolute right-5 top-5 text-[var(--accent-lavender)]" size={18} />
          <h3 className="profile-section-title text-lg font-bold text-[var(--text-primary)]">
            Daily Reflection
          </h3>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Today&apos;s Prompt:
          </p>
          <p className="mt-2 text-sm italic text-[var(--text-secondary)]">
            &quot;{promptOfTheDay}&quot;
          </p>
          <Link
            to="/exercises?category=JOURNALING"
            className="profile-action-link profile-link-gradient-rose"
          >
            Write Now -&gt;
          </Link>
        </article>

        <article className="profile-card relative overflow-hidden">
          <Heart className="absolute right-5 top-5 text-[var(--accent-peach)]" size={18} />
          <h3 className="profile-section-title text-lg font-bold text-[var(--text-primary)]">
            Therapy Session
          </h3>
          {upcomingAppointmentsQuery.isLoading ? (
            <Skeleton className="mt-4 h-6 w-48 rounded-lg" />
          ) : (
            <p className="mt-3 text-sm text-[var(--text-secondary)]">
              {upcomingSession
                ? `Next Session: ${formatAppointment(upcomingSession.datetime)}`
                : 'No upcoming sessions'}
            </p>
          )}
          <Link to="/therapy" className="profile-action-link profile-link-gradient-purple">
            {upcomingSession ? 'View Details ->' : 'Book Session ->'}
          </Link>
        </article>
      </section>

      <section className="profile-progress-section">
        <div className="profile-leaf-left" />
        <div className="profile-leaf-right" />

        <div className="relative z-10">
          <h2 className="profile-section-heading profile-section-title">
            <Sparkles size={16} />
            Progress &amp; Insights
          </h2>

          <div className="profile-progress-scroll mt-4">
            <div className="profile-progress-track">
              <article className="profile-card profile-progress-card">
                <h3 className="profile-section-title text-base font-bold text-[var(--text-primary)]">
                  Mood Insights
                </h3>
                {progressQuery.isLoading ? (
                  <Skeleton className="mt-4 h-28 w-full rounded-2xl" />
                ) : moodChartHasData ? (
                  <div className="mt-4 h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progress.moodTrend}>
                        <XAxis
                          dataKey="day"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                        />
                        <YAxis hide domain={[1, 5]} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="var(--accent-lavender)"
                          strokeWidth={3}
                          dot={{ fill: 'var(--accent-lavender)', r: 3 }}
                          connectNulls
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-[var(--text-secondary)]">
                    Log moods daily to see your 7-day trend.
                  </p>
                )}
                <Link to="/progress" className="profile-action-link profile-link-fill-lavender">
                  View Insights -&gt;
                </Link>
              </article>

              <article className="profile-card profile-progress-card">
                <h3 className="profile-section-title text-base font-bold text-[var(--text-primary)]">
                  Mindfulness Stats
                </h3>
                <div className="profile-float mt-3">
                  <svg viewBox="0 0 160 120" className="h-24 w-full">
                    <circle cx="80" cy="24" r="12" fill="var(--accent-lavender)" />
                    <path
                      d="M80 36 L80 60"
                      stroke="var(--accent-lavender)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M52 58 L108 58"
                      stroke="var(--accent-mint)"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <path
                      d="M80 60 Q60 80 44 88"
                      stroke="var(--accent-lavender)"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M80 60 Q100 80 116 88"
                      stroke="var(--accent-lavender)"
                      strokeWidth="6"
                      fill="none"
                      strokeLinecap="round"
                    />
                    <path
                      d="M56 90 Q80 100 104 90"
                      stroke="var(--accent-mint)"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                {progressQuery.isLoading ? (
                  <Skeleton className="mt-2 h-6 w-28 rounded-lg" />
                ) : (
                  <p className="mt-2 text-lg font-semibold text-[var(--accent-mint)]">
                    {progress.minutesMeditated} min this week
                  </p>
                )}
                <Link to="/progress" className="profile-action-link profile-link-fill-mint">
                  See Stats -&gt;
                </Link>
              </article>

              <article className="profile-card profile-progress-card">
                <h3 className="profile-section-title text-base font-bold text-[var(--text-primary)]">
                  Habit Tracker
                </h3>
                <div className="mt-3">
                  <svg viewBox="0 0 180 120" className="h-24 w-full">
                    <rect
                      x="50"
                      y="20"
                      width="80"
                      height="86"
                      rx="10"
                      fill="var(--bg-secondary)"
                      stroke="var(--accent-peach)"
                      strokeWidth="3"
                    />
                    <rect
                      x="68"
                      y="10"
                      width="44"
                      height="16"
                      rx="8"
                      fill="var(--accent-peach)"
                    />
                    <path
                      d="M66 44 L74 52 L88 36"
                      stroke="var(--accent-mint)"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      d="M66 66 L74 74 L88 58"
                      stroke="var(--accent-mint)"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      d="M66 88 L74 96 L88 80"
                      stroke="var(--accent-mint)"
                      strokeWidth="4"
                      fill="none"
                    />
                    <line
                      x1="96"
                      y1="44"
                      x2="118"
                      y2="44"
                      stroke="var(--accent-lavender)"
                      strokeWidth="4"
                    />
                    <line
                      x1="96"
                      y1="66"
                      x2="118"
                      y2="66"
                      stroke="var(--accent-lavender)"
                      strokeWidth="4"
                    />
                    <line
                      x1="96"
                      y1="88"
                      x2="118"
                      y2="88"
                      stroke="var(--accent-lavender)"
                      strokeWidth="4"
                    />
                  </svg>
                </div>
                {progressQuery.isLoading ? (
                  <Skeleton className="mt-2 h-6 w-28 rounded-lg" />
                ) : (
                  <p className="mt-2 text-lg font-semibold text-[var(--accent-peach)]">
                    {weeklyChecklistPercent}% complete this week
                  </p>
                )}
                <Link to="/checklist" className="profile-action-link profile-link-fill-peach">
                  Track Habits -&gt;
                </Link>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-support-banner">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="profile-heart-pulse profile-support-icon">
              <Heart size={28} />
            </div>
            <div>
              <h3 className="profile-section-title text-xl font-bold text-[var(--text-primary)]">
                Connect with Support
              </h3>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                Talk to a professional therapist today
              </p>
            </div>
          </div>

          <Link to="/therapy" className="profile-action-link profile-link-gradient-purple">
            {EMOJI.PURPLE_HEART} Get Support
          </Link>
        </div>
      </section>

      {isEditModalOpen ? (
        <div
          className="profile-modal-backdrop"
          onClick={() => setIsEditModalOpen(false)}
          role="presentation"
        >
          <div
            className="profile-modal-card"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Edit Profile"
          >
            <div className="flex items-center justify-between">
              <h3 className="profile-section-title text-2xl font-bold text-[var(--text-primary)]">
                Edit Profile
              </h3>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="rounded-full p-2 text-[var(--text-secondary)] transition hover:bg-[var(--bg-secondary)]"
                aria-label="Close edit profile modal"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="profile-modal-avatar">
                  {effectiveAvatar ? (
                    <img
                      src={effectiveAvatar}
                      alt={effectiveName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="profile-avatar-initials">{getInitials(effectiveName)}</span>
                  )}
                </div>
                <div>
                  <button
                    type="button"
                    onClick={() => modalAvatarInputRef.current?.click()}
                    className="profile-action-link profile-link-outline-mint mt-0"
                  >
                    Upload Avatar
                  </button>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    PNG or JPG recommended
                  </p>
                </div>
                <input
                  ref={modalAvatarInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>

              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                Full Name
                <input
                  value={nameDraft}
                  onChange={(event) => setNameDraft(event.target.value)}
                  className="profile-input mt-2"
                  placeholder="Your full name"
                />
              </label>

              <label className="block text-sm font-semibold text-[var(--text-primary)]">
                Display Name
                <input
                  value={displayNameDraft}
                  onChange={(event) => setDisplayNameDraft(event.target.value)}
                  className="profile-input mt-2"
                  placeholder="How should we call you?"
                />
              </label>

              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={updateProfileMutation.isPending}
                className="profile-action-link profile-link-gradient-mint mt-0 w-full justify-center disabled:opacity-60"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>

              <div className="rounded-[18px] border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                <button
                  type="button"
                  onClick={() => setIsPasswordSectionOpen((open) => !open)}
                  className="profile-collapsible-button"
                >
                  <span className="font-semibold text-[var(--text-primary)]">
                    Change Password
                  </span>
                  {isPasswordSectionOpen ? (
                    <ChevronUp size={18} className="text-[var(--accent-lavender)]" />
                  ) : (
                    <ChevronDown size={18} className="text-[var(--accent-lavender)]" />
                  )}
                </button>

                {isPasswordSectionOpen ? (
                  <div className="mt-4 space-y-3">
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(event) => setCurrentPassword(event.target.value)}
                      className="profile-input"
                      placeholder="Current password"
                    />
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      className="profile-input"
                      placeholder="New password"
                    />
                    <div className="profile-strength-track">
                      <div
                        className="profile-strength-bar"
                        style={{
                          width: `${passwordStrength.percent}%`,
                          backgroundColor: passwordStrength.color,
                        }}
                      />
                    </div>
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      Strength: {passwordStrength.label}
                    </p>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="profile-input"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={handleSavePassword}
                      disabled={changePasswordMutation.isPending}
                      className="profile-action-link profile-link-gradient-purple mt-0 w-full justify-center disabled:opacity-60"
                    >
                      {changePasswordMutation.isPending
                        ? 'Saving...'
                        : 'Save Password'}
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}