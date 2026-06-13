import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { toast } from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import { api } from '../services/api'
import type {
  ChecklistFrequency,
  ChecklistItem,
  ChecklistResponse,
} from '../types/checklist'

type ChecklistDraft = {
  label: string
  emoji: string
  frequency: ChecklistFrequency
}

const frequencyOptions: Array<{ label: string; value: ChecklistFrequency }> = [
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly', value: 'WEEKLY' },
]

const formatDateLabel = (date: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([])
  const [summary, setSummary] = useState({ total: 0, completed: 0, date: '' })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [draft, setDraft] = useState<ChecklistDraft>({
    label: '',
    emoji: '✨',
    frequency: 'DAILY',
  })
  const [dirtyItems, setDirtyItems] = useState<Record<string, ChecklistItem>>(
    {},
  )

  const loadChecklist = async () => {
    setIsLoading(true)
    try {
      const { data } = await api.get<ChecklistResponse>('/checklist')
      setItems(data.items)
      setSummary({ total: data.total, completed: data.completed, date: data.date })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load checklist'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadChecklist()
  }, [])

  const progress = useMemo(() => {
    if (summary.total === 0) return 0
    return Math.round((summary.completed / summary.total) * 100)
  }, [summary.completed, summary.total])

  const isComplete = summary.total > 0 && summary.completed === summary.total

  const handleToggleComplete = async (item: ChecklistItem) => {
    if (!item.isActive) {
      return
    }
    const endpoint = `/checklist/${item.id}/complete`
    const method = item.isCompleted ? 'delete' : 'post'

    try {
      await api.request({ url: endpoint, method })
      await loadChecklist()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to update checklist'
      toast.error(message)
    }
  }

  const handleToggleActive = (item: ChecklistItem) => {
    const next = { ...item, isActive: !item.isActive }
    setItems((prev) => prev.map((entry) => (entry.id === item.id ? next : entry)))
    setDirtyItems((prev) => ({ ...prev, [item.id]: next }))
  }

  const handleFieldChange = (item: ChecklistItem, field: 'label' | 'emoji') =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = { ...item, [field]: event.target.value }
      setItems((prev) =>
        prev.map((entry) => (entry.id === item.id ? next : entry)),
      )
      setDirtyItems((prev) => ({ ...prev, [item.id]: next }))
    }

  const handleSaveGoals = async () => {
    const updates = Object.values(dirtyItems)
    if (updates.length === 0) {
      toast('No changes to save.')
      return
    }

    setIsSaving(true)
    try {
      await Promise.all(
        updates.map((item) =>
          api.patch(`/checklist/${item.id}`, {
            label: item.label,
            emoji: item.emoji,
            frequency: item.frequency,
            isActive: item.isActive,
          }),
        ),
      )
      setDirtyItems({})
      await loadChecklist()
      toast.success('Checklist saved.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to save checklist'
      toast.error(message)
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddItem = async () => {
    if (!draft.label.trim() || !draft.emoji.trim()) {
      toast.error('Add an emoji and label.')
      return
    }

    try {
      const { data } = await api.post<ChecklistItem>('/checklist', {
        label: draft.label,
        emoji: draft.emoji,
        frequency: draft.frequency,
      })
      setItems((prev) => [...prev, data])
      setDraft({ label: '', emoji: '✨', frequency: 'DAILY' })
      setShowForm(false)
      await loadChecklist()
      toast.success('Custom task added.')
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to add task'
      toast.error(message)
    }
  }

  return (
    <div
      className="rounded-[20px] p-6 shadow-[var(--card-shadow)]"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <PageHeader
        title="Today's checklist"
        subtitle={
          summary.date
            ? formatDateLabel(summary.date)
            : 'Stay aligned with small habits that nurture your wellbeing.'
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-serenify-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Progress</p>
          <p className="text-xs text-[var(--text-secondary)]">
            {summary.completed}/{summary.total} Complete
          </p>
        </div>
        <div className="relative h-16 w-16 rounded-full">
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#A8D8C8 ${progress * 3.6}deg, rgba(168, 216, 200, 0.2) 0deg)`,
            }}
          />
          <div className="absolute inset-2 flex items-center justify-center rounded-full bg-[var(--bg-secondary)] text-xs font-semibold text-[var(--text-primary)]">
            {progress}%
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="mt-6 grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={`skeleton-${index}`}
              className="h-16 rounded-serenify bg-[var(--bg-secondary)] animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="mt-6 rounded-serenify-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-center text-sm text-[var(--text-secondary)] shadow-[var(--card-shadow)]">
          <p className="text-base">✅</p>
          <p className="mt-2 font-semibold text-[var(--text-primary)]">
            Your checklist is empty
          </p>
          <p className="mt-1 text-xs">Add a daily or weekly goal to get started.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col gap-3 rounded-serenify-lg border px-4 py-3 transition ${
                item.isCompleted
                  ? 'border-serenify-mint/50 bg-serenify-mint/15'
                  : 'border-[var(--border-color)] bg-[var(--bg-card)]'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void handleToggleComplete(item)}
                    disabled={!item.isActive}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition ${
                      item.isCompleted
                        ? 'border-serenify-mint bg-serenify-mint text-[var(--text-primary)]'
                        : 'border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]'
                    } ${item.isActive ? '' : 'cursor-not-allowed opacity-50'}`}
                    aria-label={`Toggle ${item.label}`}
                  >
                    {item.isCompleted ? '✓' : ''}
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.emoji}</span>
                      {item.isDefault ? (
                        <span
                          className={`text-sm font-semibold transition ${
                            item.isCompleted
                              ? 'text-[var(--text-muted)] line-through'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {item.label}
                        </span>
                      ) : (
                        <input
                          value={item.label}
                          onChange={handleFieldChange(item, 'label')}
                          className="rounded-serenify border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1 text-sm font-semibold text-[var(--text-primary)]"
                        />
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 3 }).map((_, index) => (
                          <span
                            key={`${item.id}-dot-${index}`}
                            className={`h-2 w-2 rounded-full ${
                              index < item.difficulty
                                ? 'bg-serenify-lavender'
                                : 'bg-serenify-lavender/30'
                            }`}
                          />
                        ))}
                      </div>
                      <span>{item.frequency === 'DAILY' ? 'Daily' : 'Weekly'}</span>
                      {item.streak > 2 && (
                        <span className="rounded-full bg-serenify-peach/60 px-2 py-0.5 text-[10px] font-semibold text-[var(--text-primary)]">
                          🔥 {item.streak} day streak
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!item.isDefault && (
                    <input
                      value={item.emoji}
                      onChange={handleFieldChange(item, 'emoji')}
                      className="w-16 rounded-serenify border border-[var(--border-color)] bg-[var(--bg-secondary)] px-2 py-1 text-sm text-[var(--text-primary)]"
                      aria-label="Emoji"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                      item.isActive
                        ? 'bg-serenify-mint/50 text-[var(--text-primary)]'
                        : 'bg-serenify-charcoal/10 text-[var(--text-muted)]'
                    }`}
                  >
                    {item.isActive ? 'Active' : 'Hidden'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setShowForm((prev) => !prev)}
          className="rounded-full border border-[var(--border-color)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)]"
        >
          + Add another
        </button>
        <button
          type="button"
          onClick={() => void handleSaveGoals()}
          className="rounded-full bg-serenify-peach px-6 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-soft disabled:opacity-60"
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Goals'}
        </button>
      </div>

      {showForm && (
        <div className="mt-4 grid gap-3 rounded-serenify-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-4">
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Add custom task
          </p>
          <div className="grid gap-3 md:grid-cols-[90px_1fr_140px]">
            <input
              value={draft.emoji}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, emoji: event.target.value }))
              }
              className="rounded-serenify border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
              placeholder="Emoji"
            />
            <input
              value={draft.label}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, label: event.target.value }))
              }
              className="rounded-serenify border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
              placeholder="What do you want to track?"
            />
            <select
              value={draft.frequency}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  frequency: event.target.value as ChecklistFrequency,
                }))
              }
              className="rounded-serenify border border-[var(--border-color)] bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)]"
            >
              {frequencyOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => void handleAddItem()}
            className="w-full rounded-full bg-serenify-mint px-4 py-2 text-sm font-semibold text-[var(--text-primary)] shadow-soft"
          >
            Add
          </button>
        </div>
      )}

      {isComplete && (
        <div className="serenify-confetti">
          {Array.from({ length: 20 }).map((_, index) => (
            <span
              key={`confetti-${index}`}
              style={{ left: `${5 + index * 4}%` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
