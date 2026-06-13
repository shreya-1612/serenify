import { useCallback, useEffect, useRef, useState } from 'react'
import ReactDOM from 'react-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import { toast } from 'react-hot-toast'
import type { AxiosError } from 'axios'
import { api } from '../services/api'
import type { Exercise, ExerciseCategory, ExerciseLog } from '../types/exercise'
import { useStatsStore } from '../store/statsStore'

type ExerciseApiError = {
  message?: string
  error?: string
}

const categories: Array<{ label: string; value: ExerciseCategory | 'ALL' }> = [
  { label: 'All', value: 'ALL' },
  { label: 'Breathing', value: 'BREATHING' },
  { label: 'Meditation', value: 'MEDITATION' },
  { label: 'Grounding', value: 'GROUNDING' },
  { label: 'Journaling', value: 'JOURNALING' },
  { label: 'Sleep', value: 'SLEEP' },
]

const categoryStyles: Record<ExerciseCategory, string> = {
  BREATHING: 'border border-[var(--border-color)] bg-[var(--bg-card)]',
  MEDITATION: 'border border-[var(--border-color)] bg-[var(--bg-card)]',
  GROUNDING: 'border border-[var(--border-color)] bg-[var(--bg-card)]',
  JOURNALING: 'border border-[var(--border-color)] bg-[var(--bg-card)]',
  SLEEP: 'border border-[var(--border-color)] bg-[var(--bg-card)]',
}

const difficultyDots = (difficulty: number) =>
  Array.from({ length: 5 }, (_, idx) => idx < difficulty)

const getThumbnail = (title: string) => {
  const key = title.toLowerCase()

  if (key.includes('5-4-3-2-1 grounding')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#d7f0df]">
        <svg viewBox="0 0 140 80" className="h-16 w-28">
          <path
            d="M25 65 L30 20 L40 20 L45 65 M55 65 L58 18 L68 18 L70 65 M78 65 L80 20 L90 20 L93 65 M100 65 L103 24 L112 24 L115 65"
            stroke="#4a8d67"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
          />
          {['22', '34', '46', '58', '70'].map((x) => (
            <circle key={x} cx={x} cy="12" r="5" fill="#6fbf8a" />
          ))}
        </svg>
      </div>
    )
  }

  if (key.includes('box breathing reset')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#d7f5ef]">
        <motion.svg
          viewBox="0 0 120 120"
          className="h-16 w-16"
          animate={{ rotate: 0 }}
        >
          <rect x="20" y="20" width="80" height="80" rx="14" fill="none" stroke="#3cbfa3" strokeWidth="6" />
          <motion.circle
            cx="20"
            cy="20"
            r="6"
            fill="#2e9e85"
            animate={{
              cx: [20, 100, 100, 20, 20],
              cy: [20, 20, 100, 100, 20],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.svg>
      </div>
    )
  }

  if (key.includes('compassionate check-in')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#fde6d8]">
        <svg viewBox="0 0 120 80" className="h-16 w-24">
          <path
            d="M30 50 C15 45 15 30 28 28 C35 27 40 30 42 35 C44 25 58 22 65 30 C80 22 95 35 85 52 C75 68 55 70 45 60"
            fill="#f2a58c"
          />
          <path
            d="M40 45 C55 30 70 30 80 45 C72 60 58 64 50 56"
            fill="#f7c3a8"
          />
        </svg>
      </div>
    )
  }

  if (key.includes('evening gratitude')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#fff1d7]">
        <svg viewBox="0 0 120 80" className="h-16 w-24">
          <rect x="22" y="20" width="76" height="40" rx="10" fill="#f6c48f" />
          <rect x="30" y="30" width="30" height="4" fill="#c87a44" />
          <rect x="30" y="40" width="26" height="4" fill="#c87a44" />
          <polygon points="70,14 74,24 84,26 76,32 78,42 70,36 62,42 64,32 56,26 66,24" fill="#f5d06b" />
        </svg>
      </div>
    )
  }

  if (key.includes('evening reflection')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#dde6f4]">
        <svg viewBox="0 0 140 80" className="h-16 w-28">
          <circle cx="100" cy="20" r="12" fill="#9fb2d9" />
          <path d="M0 50 C30 40 60 40 90 50 C110 56 125 58 140 54 V80 H0Z" fill="#88a0d2" />
          <path d="M0 60 C30 50 60 50 90 60 C110 66 125 68 140 64 V80 H0Z" fill="#6e86b8" />
        </svg>
      </div>
    )
  }

  if (key.includes('feet on the floor')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#e4f1e5]">
        <svg viewBox="0 0 140 80" className="h-16 w-28">
          <rect x="40" y="20" width="20" height="40" rx="10" fill="#5b8f6e" />
          <rect x="70" y="20" width="20" height="40" rx="10" fill="#5b8f6e" />
          <path d="M10 65 C30 60 50 60 70 65 C90 70 110 70 130 65" stroke="#3f6f52" strokeWidth="4" fill="none" />
        </svg>
      </div>
    )
  }

  if (key.includes('loving kindness')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#fde2ea]">
        <motion.svg viewBox="0 0 120 80" className="h-16 w-24">
          <motion.circle
            cx="60"
            cy="40"
            r="18"
            fill="#f0a4b5"
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="60"
            cy="40"
            r="28"
            fill="none"
            stroke="#f6c2cf"
            strokeWidth="3"
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.svg>
      </div>
    )
  }

  if (key.includes('midday grounding stretch')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#fef3c7]">
        <svg viewBox="0 0 120 80" className="h-16 w-24">
          <circle cx="90" cy="20" r="12" fill="#f7c948" />
          <path d="M90 4 V36 M74 20 H106" stroke="#f0b429" strokeWidth="2" />
          <circle cx="40" cy="32" r="6" fill="#5f9b5f" />
          <path d="M40 38 L30 54 L50 54 Z" fill="#5f9b5f" />
          <path d="M30 54 L20 64" stroke="#5f9b5f" strokeWidth="4" />
          <path d="M50 54 L60 64" stroke="#5f9b5f" strokeWidth="4" />
        </svg>
      </div>
    )
  }

  if (key.includes('mindful minute')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#fdebd3]">
        <motion.svg viewBox="0 0 120 80" className="h-16 w-24">
          <path d="M60 16 C52 28 62 36 60 46 C70 36 72 26 60 16" fill="#f59f55" />
          <motion.circle
            cx="60"
            cy="42"
            r="20"
            fill="none"
            stroke="#f5b977"
            strokeWidth="3"
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
        </motion.svg>
      </div>
    )
  }

  if (key.includes('morning body scan')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#e0eefc]">
        <motion.svg viewBox="0 0 120 80" className="h-16 w-24">
          <path d="M60 18 C52 18 50 26 50 30 C50 34 54 38 54 42 V60 H66 V42 C66 38 70 34 70 30 C70 26 68 18 60 18" fill="none" stroke="#5b8bd8" strokeWidth="3" />
          <motion.rect
            x="40"
            y="20"
            width="40"
            height="8"
            fill="#7fb0e6"
            animate={{ y: [20, 48, 20] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.svg>
      </div>
    )
  }

  if (key.includes('body scan relaxation')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#eef2ff]">
        <svg viewBox="0 0 120 80" className="h-16 w-24">
          <path d="M60 16 C50 16 48 26 48 30 C48 36 52 40 52 46 V62 H68 V46 C68 40 72 36 72 30 C72 26 70 16 60 16" fill="#c7d2fe" />
          <rect x="52" y="24" width="16" height="6" fill="#f9a8d4" />
          <rect x="50" y="34" width="20" height="6" fill="#bfdbfe" />
          <rect x="50" y="44" width="20" height="6" fill="#bbf7d0" />
          <rect x="52" y="54" width="16" height="6" fill="#fde68a" />
        </svg>
      </div>
    )
  }

  if (key.includes('box breathing')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#e6ddff]">
        <motion.svg viewBox="0 0 120 120" className="h-16 w-16">
          <rect x="20" y="20" width="80" height="80" rx="14" fill="none" stroke="#8b7ff5" strokeWidth="6" />
          <motion.circle
            cx="20"
            cy="20"
            r="6"
            fill="#6b63d8"
            animate={{
              cx: [20, 100, 100, 20, 20],
              cy: [20, 20, 100, 100, 20],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
        </motion.svg>
      </div>
    )
  }

  if (key.includes('4-7-8 breathing')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#d8f4f2]">
        <svg viewBox="0 0 120 80" className="h-16 w-24">
          <circle cx="30" cy="40" r="16" fill="none" stroke="#3fb7b2" strokeWidth="4" />
          <circle cx="60" cy="40" r="16" fill="none" stroke="#3fb7b2" strokeWidth="4" />
          <circle cx="90" cy="40" r="16" fill="none" stroke="#3fb7b2" strokeWidth="4" />
          <text x="26" y="45" fill="#2e7f7c" fontSize="12">4</text>
          <text x="56" y="45" fill="#2e7f7c" fontSize="12">7</text>
          <text x="86" y="45" fill="#2e7f7c" fontSize="12">8</text>
        </svg>
      </div>
    )
  }

  if (key.includes('progressive muscle relaxation')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#ffe6cc]">
        <svg viewBox="0 0 140 80" className="h-16 w-28">
          <path d="M10 30 C30 20 50 20 70 30 C90 40 110 40 130 30" stroke="#f39b4a" strokeWidth="4" fill="none" />
          <path d="M10 50 C30 40 50 40 70 50 C90 60 110 60 130 50" stroke="#f6b26b" strokeWidth="4" fill="none" />
        </svg>
      </div>
    )
  }

  if (key.includes('sleep body scan')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#dfe7f7]">
        <svg viewBox="0 0 120 80" className="h-16 w-24">
          <path d="M60 16 C50 16 48 26 48 30 C48 36 52 40 52 46 V62 H68 V46 C68 40 72 36 72 30 C72 26 70 16 60 16" fill="#a8b8e5" />
          <path d="M68 34a12 12 0 1 0 0 24a10 10 0 1 1 0-24z" fill="#5b6fa8" />
        </svg>
      </div>
    )
  }

  if (key.includes('counting breaths')) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#d8f5ef]">
        <motion.svg viewBox="0 0 140 80" className="h-16 w-28">
          <motion.text
            x="22"
            y="35"
            fill="#2c8f7f"
            fontSize="16"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            1
          </motion.text>
          <motion.text
            x="62"
            y="35"
            fill="#2c8f7f"
            fontSize="16"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1 }}
          >
            2
          </motion.text>
          <motion.text
            x="102"
            y="35"
            fill="#2c8f7f"
            fontSize="16"
            animate={{ opacity: [0.2, 1, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, delay: 2 }}
          >
            3
          </motion.text>
          <path d="M20 50 C40 44 60 44 80 50 C100 56 120 56 140 50" stroke="#3cbfa3" strokeWidth="3" fill="none" />
        </motion.svg>
      </div>
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center rounded-serenify bg-[#eef2f7]">
      <svg viewBox="0 0 120 80" className="h-16 w-24">
        <circle cx="60" cy="40" r="18" fill="#94a3b8" />
        <path d="M30 50 C45 40 75 40 90 50" stroke="#64748b" strokeWidth="4" fill="none" />
      </svg>
    </div>
  )
}

export default function ExercisesPage() {
  const [activeCategory, setActiveCategory] = useState<ExerciseCategory | 'ALL'>(
    'ALL',
  )
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  )
  const [showComplete, setShowComplete] = useState(false)
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale'>(
    'Inhale',
  )
  const [breathCycle, setBreathCycle] = useState(1)
  const [breathRunning, setBreathRunning] = useState(true)
  const [meditationSeconds, setMeditationSeconds] = useState(0)
  const [meditationRunning, setMeditationRunning] = useState(false)
  const [groundingStep, setGroundingStep] = useState(0)
  const [journalEntry, setJournalEntry] = useState('')
  const timerRef = useRef<number | null>(null)
  const statsStore = useStatsStore((state) => state.incrementExercise)

  const resetExerciseState = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      window.clearInterval(timerRef.current)
      timerRef.current = null
    }
    setBreathPhase('Inhale')
    setBreathCycle(0)
    setBreathRunning(false)
    setMeditationSeconds(0)
    setMeditationRunning(false)
    setGroundingStep(0)
    setJournalEntry('')
  }, [])

  const closeModal = useCallback(() => {
    resetExerciseState()
    setShowComplete(false)
    setSelectedExercise(null)
  }, [resetExerciseState])

  const exercisesQuery = useQuery({
    queryKey: ['exercises', activeCategory],
    queryFn: async () => {
      const params =
        activeCategory === 'ALL' ? {} : { category: activeCategory }
      const { data } = await api.get<Exercise[] | { exercises: Exercise[] }>(
        '/exercises',
        { params },
      )
      if (Array.isArray(data)) {
        return data
      }
      return data.exercises ?? []
    },
  })

  const completeMutation = useMutation({
    mutationFn: async (payload: { id: string; minutes: number; notes?: string }) => {
      const { data } = await api.post<ExerciseLog>(
        `/exercises/${payload.id}/complete`,
        { durationMinutes: payload.minutes, notes: payload.notes },
      )
      return data
    },
    onSuccess: (_data, payload) => {
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } })
      statsStore(payload.minutes, selectedExercise?.category === 'MEDITATION')
      setShowComplete(true)
    },
  })

  const journalMutation = useMutation({
    mutationFn: async (payload: { id: string; content: string }) => {
      await api.post(`/exercises/${payload.id}/journal`, {
        content: payload.content,
      })
    },
    onSuccess: () => {
      toast.success('Entry saved successfully')
      setJournalEntry('')
    },
    onError: (error: unknown) => {
      const typedError = error as AxiosError<ExerciseApiError>
      const message =
        typedError.response?.data?.message ||
        typedError.response?.data?.error ||
        'Unable to save entry'
      toast.error(message)
    },
  })

  const openExercise = useCallback(
    (exercise: Exercise) => {
      resetExerciseState()
      setShowComplete(false)
      setSelectedExercise(exercise)

      if (exercise.category === 'BREATHING') {
        setBreathPhase('Inhale')
        setBreathCycle(1)
        setBreathRunning(true)
      }

      if (exercise.category === 'MEDITATION') {
        setMeditationSeconds(exercise.duration * 60)
        setMeditationRunning(true)
      }

      if (exercise.category === 'GROUNDING') {
        setGroundingStep(0)
      }

      if (exercise.category === 'JOURNALING') {
        setJournalEntry('')
      }
    },
    [resetExerciseState],
  )

  const handleJournalSave = () => {
    if (!selectedExercise) return
    const content = journalEntry.trim()
    if (!content) {
      toast.error('Entry cannot be empty')
      return
    }
    journalMutation.mutate({ id: selectedExercise.id, content })
  }

  useEffect(() => {
    if (!selectedExercise) return
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [closeModal, selectedExercise])

  useEffect(() => {
    if (!selectedExercise || selectedExercise.category !== 'BREATHING') return
    if (!breathRunning) return
    const phases: Array<{ label: 'Inhale' | 'Hold' | 'Exhale'; duration: number }> = [
      { label: 'Inhale', duration: 4 },
      { label: 'Hold', duration: 4 },
      { label: 'Exhale', duration: 4 },
    ]
    const currentIndex = phases.findIndex((phase) => phase.label === breathPhase)
    timerRef.current = window.setTimeout(() => {
      const nextIndex = (currentIndex + 1) % phases.length
      setBreathPhase(phases[nextIndex].label)
      if (nextIndex === 0) {
        setBreathCycle((cycle) => Math.min(cycle + 1, 5))
      }
    }, phases[currentIndex].duration * 1000)
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [breathPhase, breathRunning, selectedExercise])

  useEffect(() => {
    if (!selectedExercise || selectedExercise.category !== 'MEDITATION') return
    if (!meditationRunning) return
    timerRef.current = window.setInterval(() => {
      setMeditationSeconds((prev) => Math.max(prev - 1, 0))
    }, 1000)
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [meditationRunning, selectedExercise])

  const filteredExercises = exercisesQuery.data ?? []

  const modalTitle = selectedExercise?.title ?? ''
  const stepList = selectedExercise?.content.steps ?? []
  const prompt = selectedExercise?.content.prompts?.[0] ?? ''
  const meditationProgress = selectedExercise
    ? ((selectedExercise.duration * 60 - meditationSeconds) /
        (selectedExercise.duration * 60)) *
      100
    : 0

  const wordCount = journalEntry.trim().split(/\s+/).filter(Boolean).length

  return (
    <div
      className="rounded-[20px] p-6 shadow-[var(--card-shadow)]"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <div className="mb-6 flex flex-col gap-2">
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">
          Mind exercises
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Curated rituals to steady your mind and body.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.value}
            type="button"
            onClick={() => setActiveCategory(category.value)}
            className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
              activeCategory === category.value
                ? 'bg-serenify-mint text-[var(--text-primary)]'
                : 'border border-[var(--border-color)] text-[var(--text-secondary)]'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {exercisesQuery.isLoading
          ? Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`exercise-skeleton-${index}`}
                className="h-64 rounded-serenify-lg bg-serenify-lavender/20 animate-pulse"
              />
            ))
          : filteredExercises.map((exercise) => (
          <div
            key={exercise.id}
            className={`rounded-serenify-lg p-4 shadow-soft ${
              categoryStyles[exercise.category]
            }`}
          >
            <span className="rounded-full bg-[var(--bg-secondary)] px-3 py-1 text-[10px] font-semibold uppercase text-[var(--text-primary)]">
              {exercise.category}
            </span>
            <div className="mt-4 flex h-[120px] w-full items-center justify-center rounded-serenify">
              {getThumbnail(exercise.title)}
            </div>
            <p className="mt-3 text-sm font-semibold text-[var(--text-primary)]">
              {exercise.title}
            </p>
            <div className="mt-2 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
              <span>{exercise.duration} min</span>
              <span>•</span>
              <span className="flex gap-1">
                {difficultyDots(exercise.difficulty).map((filled, idx) => (
                  <span
                    key={`${exercise.id}-dot-${idx}`}
                    className={`h-2 w-2 rounded-full ${
                      filled ? 'bg-serenify-charcoal' : 'bg-serenify-charcoal/20'
                    }`}
                  />
                ))}
              </span>
            </div>
            <button
              type="button"
              onClick={() => openExercise(exercise)}
              className="mt-4 w-full rounded-full border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
            >
              Start
            </button>
          </div>
        ))}
      </div>

      {selectedExercise &&
        !showComplete &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={closeModal}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                padding: '32px',
                width: '90%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                className="absolute right-4 top-4 text-sm text-[var(--text-secondary)]"
                onClick={closeModal}
              >
                Close
              </button>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">
                {modalTitle}
              </h3>
              <p className="text-sm text-[var(--text-secondary)]">
                {selectedExercise.description}
              </p>

            {selectedExercise.category === 'BREATHING' && (
              <div className="mt-6 flex flex-col items-center gap-4">
                <motion.div
                  animate={{ scale: breathPhase === 'Inhale' ? 1.1 : breathPhase === 'Exhale' ? 0.9 : 1 }}
                  transition={{ duration: 4 }}
                  className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-serenify-mint"
                >
                  <span className="text-lg font-semibold text-[var(--text-primary)]">
                    {breathPhase}...
                  </span>
                </motion.div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Cycle {breathCycle} of 5
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBreathRunning((prev) => !prev)}
                    className="rounded-full border border-serenify-lavender/40 px-4 py-2 text-xs font-semibold"
                  >
                    {breathRunning ? 'Pause' : 'Resume'}
                  </button>
                  {breathCycle >= 5 && (
                    <button
                      type="button"
                      onClick={() =>
                        completeMutation.mutate({
                          id: selectedExercise.id,
                          minutes: selectedExercise.duration,
                        })
                      }
                      className="rounded-full bg-serenify-mint px-4 py-2 text-xs font-semibold"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedExercise.category === 'MEDITATION' && (
              <div className="mt-6">
                <div className="flex flex-col items-center gap-4 rounded-serenify border border-[var(--border-color)] bg-[var(--bg-secondary)] py-6">
                  <motion.div
                    animate={{ scale: meditationRunning ? [1, 1.05, 1] : 1 }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    className="text-4xl font-bold text-[var(--text-primary)]"
                  >
                    {String(Math.floor(meditationSeconds / 60)).padStart(2, '0')}:
                    {String(meditationSeconds % 60).padStart(2, '0')}
                  </motion.div>
                  <div className="h-2 w-2/3 rounded-full bg-[var(--bg-card)]">
                    <div
                      className="h-2 rounded-full bg-serenify-mint"
                      style={{ width: `${meditationProgress}%` }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setMeditationRunning((prev) => !prev)}
                    className="rounded-full border border-serenify-lavender/40 px-4 py-2 text-xs font-semibold"
                  >
                    {meditationRunning ? 'Pause' : 'Play'}
                  </button>
                  {meditationSeconds === 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        completeMutation.mutate({
                          id: selectedExercise.id,
                          minutes: selectedExercise.duration,
                        })
                      }
                      className="rounded-full bg-serenify-mint px-4 py-2 text-xs font-semibold"
                    >
                      Complete
                    </button>
                  )}
                </div>
              </div>
            )}

            {selectedExercise.category === 'GROUNDING' && (
              <div className="mt-6 space-y-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  Step {groundingStep + 1} of {stepList.length}
                </p>
                <div className="rounded-serenify bg-serenify-peach/40 p-4 text-sm text-[var(--text-primary)]">
                  {stepList[groundingStep]}
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setGroundingStep((prev) =>
                      Math.min(prev + 1, stepList.length - 1),
                    )
                  }
                  className="rounded-full bg-serenify-mint px-4 py-2 text-xs font-semibold"
                >
                  Next Step
                </button>
                {groundingStep === stepList.length - 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      completeMutation.mutate({
                        id: selectedExercise.id,
                        minutes: selectedExercise.duration,
                      })
                    }
                    className="rounded-full border border-serenify-lavender/40 px-4 py-2 text-xs font-semibold"
                  >
                    Complete
                  </button>
                )}
              </div>
            )}

            {selectedExercise.category === 'JOURNALING' && (
              <div className="mt-6 space-y-4">
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {prompt}
                </p>
                <textarea
                  value={journalEntry}
                  onChange={(event) => setJournalEntry(event.target.value)}
                  rows={6}
                  className="w-full rounded-serenify border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3 text-sm text-[var(--text-primary)]"
                />
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span>{wordCount} words</span>
                  <button
                    type="button"
                    onClick={handleJournalSave}
                    disabled={journalMutation.isPending}
                    className="rounded-full bg-serenify-mint px-4 py-2 text-xs font-semibold"
                  >
                    {journalMutation.isPending ? 'Saving...' : 'Save Entry'}
                  </button>
                </div>
              </div>
            )}

            {selectedExercise.category === 'SLEEP' && (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-[var(--text-secondary)]">
                  Follow the steps, then complete to log your rest ritual.
                </p>
                <ul className="space-y-2 text-sm text-[var(--text-primary)]">
                  {stepList.map((step) => (
                    <li key={step} className="rounded-serenify bg-[var(--bg-secondary)] px-4 py-2">
                      {step}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() =>
                    completeMutation.mutate({
                      id: selectedExercise.id,
                      minutes: selectedExercise.duration,
                    })
                  }
                  className="rounded-full bg-serenify-mint px-4 py-2 text-xs font-semibold"
                >
                  Complete
                </button>
              </div>
            )}
            </div>
          </div>,
          document.body,
        )}

      {showComplete &&
        typeof document !== 'undefined' &&
        ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              zIndex: 10000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
            onClick={closeModal}
          >
            <div
              style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border-color)',
                padding: '32px',
                width: '90%',
                maxWidth: '560px',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
                textAlign: 'center',
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="text-lg font-semibold text-[var(--text-primary)]">
                Exercise Complete! +1 to your streak 🎉
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="mt-4 rounded-full bg-serenify-mint px-5 py-2 text-xs font-semibold"
              >
                Back to exercises
              </button>
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
