import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-hot-toast'
import { useAuthStore } from '../store/authStore'

const intents = [
  'Manage Anxiety',
  'Better Sleep',
  'Build Habits',
  'Find Therapy',
  'General Wellness',
]

const moods = [
  { label: 'Calm', emoji: '😌' },
  { label: 'Hopeful', emoji: '🌤️' },
  { label: 'Tired', emoji: '😴' },
  { label: 'Anxious', emoji: '🫧' },
  { label: 'Heavy', emoji: '🌧️' },
]

const checklistDefaults = [
  'Meditate for 10 minutes',
  'Drink 8 glasses of water',
  'Write in journal',
  'Exercise for 30 minutes',
  'Get 7-8 hours of sleep',
  'Practice gratitude',
  'Limit screen time',
]

export default function OnboardingPage() {
  const navigate = useNavigate()
  const updateUser = useAuthStore((state) => state.updateUser)
  const user = useAuthStore((state) => state.user)

  const [step, setStep] = useState(1)
  const [selectedIntents, setSelectedIntents] = useState<string[]>([])
  const [selectedMood, setSelectedMood] = useState(moods[0].label)
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    checklistDefaults,
  )

  const progress = useMemo(() => (step / 3) * 100, [step])

  const toggleIntent = (intent: string) => {
    setSelectedIntents((prev) =>
      prev.includes(intent)
        ? prev.filter((item) => item !== intent)
        : [...prev, intent],
    )
  }

  const toggleGoal = (goal: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goal)
        ? prev.filter((item) => item !== goal)
        : [...prev, goal],
    )
  }

  const handleContinue = () => {
    if (step < 3) {
      setStep((prev) => prev + 1)
      return
    }

    if (!user) {
      toast.error('Please log in first.')
      navigate('/login')
      return
    }

    updateUser({
      ...user,
      onboarding: {
        intents: selectedIntents,
        mood: selectedMood,
        goals: selectedGoals,
      },
    })

    toast.success('Onboarding complete!')
    navigate('/dashboard')
  }

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-4xl flex-col gap-8 rounded-serenify-lg bg-serenify-white/80 p-8 shadow-soft backdrop-blur dark:border dark:border-[var(--border)] dark:bg-[var(--card)]">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-serenify-charcoal/60">
          Onboarding
        </p>
        <div className="mt-3 h-2 w-full rounded-full bg-serenify-lavender/30">
          <div
            className="h-2 rounded-full bg-serenify-mint"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-xs font-semibold text-serenify-charcoal/60">
          Step {step} of 3
        </p>
      </div>

      {step === 1 && (
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold text-serenify-charcoal">
            Why are you here?
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {intents.map((intent) => (
              <button
                key={intent}
                type="button"
                onClick={() => toggleIntent(intent)}
                className={`rounded-serenify border px-4 py-3 text-left text-sm font-semibold transition ${
                  selectedIntents.includes(intent)
                    ? 'border-serenify-mint bg-serenify-mint/40'
                    : 'border-serenify-lavender/40 bg-white'
                }`}
              >
                {intent}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold text-serenify-charcoal">
            How are you feeling today?
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {moods.map((mood) => (
              <button
                key={mood.label}
                type="button"
                onClick={() => setSelectedMood(mood.label)}
                className={`flex flex-col items-center gap-2 rounded-serenify border px-4 py-4 text-sm font-semibold ${
                  selectedMood === mood.label
                    ? 'border-serenify-peach bg-serenify-peach/50'
                    : 'border-serenify-lavender/40 bg-white'
                }`}
              >
                <span className="text-2xl">{mood.emoji}</span>
                <span>{mood.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-4">
          <h2 className="text-2xl font-bold text-serenify-charcoal">
            Set your first goals
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {checklistDefaults.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`rounded-serenify border px-4 py-3 text-left text-sm font-semibold ${
                  selectedGoals.includes(goal)
                    ? 'border-serenify-lavender bg-serenify-lavender/30'
                    : 'border-serenify-lavender/40 bg-white'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((prev) => Math.max(1, prev - 1))}
          className="rounded-full border border-serenify-lavender/50 px-5 py-2 text-sm font-semibold text-serenify-charcoal"
          disabled={step === 1}
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleContinue}
          className="rounded-full bg-serenify-mint px-6 py-2 text-sm font-semibold text-serenify-charcoal shadow-soft"
        >
          {step === 3 ? 'Finish' : 'Continue'}
        </button>
      </div>
    </div>
  )
}
