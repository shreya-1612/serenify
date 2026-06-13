import { useCallback, useEffect, useMemo, useState } from 'react'
import ReactDOM from 'react-dom'
import { toast } from 'react-hot-toast'
import PageHeader from '../components/ui/PageHeader'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import useDebouncedValue from '../hooks/useDebouncedValue'
import type {
  Appointment,
  AppointmentType,
  AvailabilityResponse,
  Therapist,
} from '../types/therapy'

const formatCountdown = (value: string) => {
  const diffMs = new Date(value).getTime() - Date.now()
  if (diffMs <= 0) return 'Starting now'
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  const remainingHours = hours % 24
  return `In ${days} days, ${remainingHours} hours`
}

const formatSessionDate = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))

const formatSessionTime = (value: string) =>
  new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value))

type TherapistModalAvailability = {
  date: string
  slots: string[]
}

type TherapistModalProps = {
  therapist: Therapist
  onClose: () => void
  onBooked: () => Promise<void> | void
  rescheduleId?: string | null
  initialNotes?: string
  initialType?: AppointmentType
}

const TherapistModal = ({
  therapist,
  onClose,
  onBooked,
  rescheduleId,
  initialNotes = '',
  initialType = 'VIDEO',
}: TherapistModalProps) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [sessionType, setSessionType] = useState<AppointmentType>(initialType)
  const [notes, setNotes] = useState(initialNotes)
  const [availability, setAvailability] = useState<TherapistModalAvailability[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    const fetchAvailability = async () => {
      try {
        const res = await api.get<AvailabilityResponse>(
          `/therapists/${therapist.id}/availability`,
        )
        const days = res.data.days ?? []
        setAvailability(days)
        if (days.length > 0) {
          setSelectedDate(days[0].date)
          setSelectedSlot(null)
        }
      } catch (error) {
        console.error('Failed to fetch availability:', error)
        toast.error('Unable to load availability')
      }
    }

    void fetchAvailability()

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [therapist.id])

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) return
    setLoading(true)
    try {
      const datetime = new Date(`${selectedDate}T${selectedSlot}:00`).toISOString()
      if (rescheduleId) {
        await api.patch(`/appointments/${rescheduleId}/reschedule`, { datetime })
        toast.success('Session rescheduled.')
      } else {
        await api.post('/appointments', {
          therapistId: therapist.id,
          datetime,
          type: sessionType,
          notes,
        })
        toast.success('Session booked successfully! 🎉')
      }
      await onBooked()
      onClose()
    } catch (error) {
      console.error('Failed to book session:', error)
      toast.error('Failed to book session. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const initials = therapist.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)

  return ReactDOM.createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '860px',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          position: 'relative',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-secondary)',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
        >
          ×
        </button>

        <div style={{ padding: '32px', borderRight: '1px solid var(--border-color)' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #A8D8C8, #8B6FBE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '16px',
            }}
          >
            {initials}
          </div>

          <h2
            style={{
              margin: '0 0 8px',
              fontSize: '22px',
              fontWeight: '700',
              color: 'var(--text-primary)',
            }}
          >
            {therapist.name}
          </h2>

          <span
            style={{
              background: 'color-mix(in srgb, var(--accent-mint) 20%, var(--bg-card))',
              color: 'var(--accent-mint)',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            {therapist.specialty}
          </span>

          <div
            style={{
              margin: '12px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: 'var(--accent-peach)' }}>★★★★★</span>
            <span style={{ fontWeight: '600' }}>{therapist.rating}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              • {therapist.experience} years experience
            </span>
          </div>

          <div
            style={{
              fontSize: '20px',
              fontWeight: '700',
              color: 'var(--accent-mint)',
              margin: '8px 0 16px',
            }}
          >
            ₹{therapist.price} / session
          </div>

          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', fontSize: '14px' }}>
            {therapist.bio}
          </p>

          <div style={{ marginTop: '20px' }}>
            <p style={{ fontWeight: '600', marginBottom: '8px', fontSize: '14px' }}>
              Session Types Available
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              {['Video', 'Chat', 'Phone'].map((type) => (
                <span
                  key={type}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid var(--border-color)',
                    fontSize: '13px',
                    color: 'var(--sidebar-active-text)',
                  }}
                >
                  {type === 'Video' ? '📹' : type === 'Chat' ? '💬' : '📞'} {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: '700' }}>
            Book a Session
          </h3>

          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}>
            Pick a date
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginBottom: '20px',
            }}
          >
            {availability.slice(0, 9).map((slot) => (
              <button
                key={slot.date}
                onClick={() => {
                  setSelectedDate(slot.date)
                  setSelectedSlot(null)
                }}
                style={{
                  padding: '8px 4px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor:
                    selectedDate === slot.date
                      ? 'var(--accent-mint)'
                      : 'var(--border-color)',
                  background:
                    selectedDate === slot.date
                      ? 'color-mix(in srgb, var(--accent-mint) 18%, var(--bg-card))'
                      : 'var(--bg-card)',
                  color:
                    selectedDate === slot.date
                      ? 'var(--accent-mint)'
                      : 'var(--text-primary)',
                  fontSize: '12px',
                  cursor: 'pointer',
                  fontWeight: selectedDate === slot.date ? '600' : '400',
                  textAlign: 'center',
                }}
              >
                {new Date(slot.date).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </button>
            ))}
          </div>

          {selectedDate && (
            <>
              <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}>
                Available slots
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '20px',
                }}
              >
                {availability
                  .find((entry) => entry.date === selectedDate)
                  ?.slots.map((slot) => (
                    <button
                      key={slot}
                      onClick={() => setSelectedSlot(slot)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        border: '1px solid',
                        borderColor:
                          selectedSlot === slot
                            ? 'var(--accent-mint)'
                            : 'var(--border-color)',
                        background:
                          selectedSlot === slot
                            ? 'color-mix(in srgb, var(--accent-mint) 18%, var(--bg-card))'
                            : 'var(--bg-card)',
                        color:
                          selectedSlot === slot
                            ? 'var(--accent-mint)'
                            : 'var(--text-primary)',
                        fontSize: '13px',
                        cursor: 'pointer',
                        fontWeight: selectedSlot === slot ? '600' : '400',
                      }}
                    >
                      {slot}
                    </button>
                  ))}
              </div>
            </>
          )}

          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '10px' }}>
            Session type
          </p>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
            {[
              { value: 'VIDEO', label: '📹 Video' },
              { value: 'CHAT', label: '💬 Chat' },
              { value: 'PHONE', label: '📞 Phone' },
            ].map((type) => (
              <button
                key={type.value}
                onClick={() => setSessionType(type.value as AppointmentType)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  border: '1px solid',
                  borderColor:
                    sessionType === type.value
                      ? 'var(--accent-mint)'
                      : 'var(--border-color)',
                  background:
                    sessionType === type.value
                      ? 'color-mix(in srgb, var(--accent-mint) 18%, var(--bg-card))'
                      : 'var(--bg-card)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: sessionType === type.value ? '600' : '400',
                  color:
                    sessionType === type.value
                      ? 'var(--accent-mint)'
                      : 'var(--text-primary)',
                }}
              >
                {type.label}
              </button>
            ))}
          </div>

          <p style={{ fontWeight: '600', fontSize: '14px', marginBottom: '8px' }}>
            Notes (optional)
          </p>
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Share any goals or topics for the session..."
            style={{
              width: '100%',
              height: '80px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              background: 'var(--bg-secondary)',
              padding: '12px',
              fontSize: '13px',
              resize: 'none',
              fontFamily: 'inherit',
              marginBottom: '16px',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              padding: '12px 16px',
              background: 'var(--bg-primary)',
              borderRadius: '12px',
            }}
          >
            <span style={{ fontWeight: '600' }}>Total</span>
            <span
              style={{
                fontWeight: '700',
                fontSize: '18px',
                color: 'var(--accent-mint)',
              }}
            >
              ₹{therapist.price}
            </span>
          </div>

          <button
            onClick={handleBooking}
            disabled={!selectedDate || !selectedSlot || loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '14px',
              border: 'none',
              background:
                selectedDate && selectedSlot
                  ? 'linear-gradient(135deg, #3BBFA3, #2D9E7E)'
                  : 'var(--border-color)',
              color: selectedDate && selectedSlot ? 'white' : 'var(--text-muted)',
              fontSize: '16px',
              fontWeight: '600',
              cursor: selectedDate && selectedSlot ? 'pointer' : 'not-allowed',
            }}
          >
            {loading
              ? 'Booking...'
              : rescheduleId
                ? 'Confirm Reschedule'
                : 'Confirm Booking'}
          </button>

          {!selectedDate && (
            <p
              style={{
                textAlign: 'center',
                fontSize: '12px',
                color: 'var(--text-muted)',
                marginTop: '8px',
              }}
            >
              Please select a date and time slot to continue
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

export default function TherapyPage() {
  const [activeTab, setActiveTab] = useState<'find' | 'sessions'>('find')
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearch = useDebouncedValue(searchTerm, 300)
  const [activeFilter, setActiveFilter] = useState('All')
  const [therapists, setTherapists] = useState<Therapist[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [therapistError, setTherapistError] = useState('')
  const [appointmentError, setAppointmentError] = useState('')
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(
    null,
  )
  const [rescheduleNotes, setRescheduleNotes] = useState('')
  const [rescheduleType, setRescheduleType] = useState<AppointmentType>('VIDEO')
  const [upcoming, setUpcoming] = useState<Appointment[]>([])
  const [past, setPast] = useState<Appointment[]>([])
  const [rescheduleId, setRescheduleId] = useState<string | null>(null)
  const [cancelTarget, setCancelTarget] = useState<Appointment | null>(null)
  const [avatarFallbacks, setAvatarFallbacks] = useState<Record<string, boolean>>({})
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  const specialties = useMemo(
    () => ['All', ...new Set(therapists.map((therapist) => therapist.specialty))],
    [therapists],
  )

  const filteredTherapists = useMemo(() => {
    const base =
      activeFilter === 'All'
        ? therapists
        : therapists.filter((therapist) =>
            therapist.specialty
              .toLowerCase()
              .includes(activeFilter.toLowerCase()),
          )

    return base.filter((therapist) => {
      const query = debouncedSearch.toLowerCase()
      return (
        therapist.name.toLowerCase().includes(query) ||
        therapist.specialty.toLowerCase().includes(query)
      )
    })
  }, [therapists, debouncedSearch, activeFilter])

  const loadTherapists = async () => {
    setIsLoading(true)
    setTherapistError('')
    try {
      const { data } = await api.get<Therapist[]>('/therapists')
      setTherapists(data)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load therapists'
      setTherapistError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const loadAppointments = useCallback(async () => {
    if (!isAuthenticated) {
      setUpcoming([])
      setPast([])
      setAppointmentError('Sign in to view your sessions.')
      return
    }
    setAppointmentError('')
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        api.get<{ appointments: Appointment[] }>('/appointments', {
          params: { status: 'upcoming' },
        }),
        api.get<{ appointments: Appointment[] }>('/appointments', {
          params: { status: 'past' },
        }),
      ])
      setUpcoming(upcomingRes.data.appointments)
      setPast(pastRes.data.appointments)
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to load appointments'
      setAppointmentError(message)
      toast.error(message)
    }
  }, [isAuthenticated])

  useEffect(() => {
    void loadTherapists()
  }, [])

  useEffect(() => {
    if (activeTab === 'sessions') {
      void loadAppointments()
    }
  }, [activeTab, loadAppointments])

  const openProfile = async (therapist: Therapist) => {
    if (selectedTherapist?.id === therapist.id) {
      closeProfile()
      return
    }
    setSelectedTherapist(therapist)
    setRescheduleId(null)
    setRescheduleNotes('')
    setRescheduleType('VIDEO')
  }

  const closeProfile = () => {
    setSelectedTherapist(null)
    setRescheduleId(null)
    setRescheduleNotes('')
    setRescheduleType('VIDEO')
  }

  const handleCancel = async (appointmentId: string) => {
    try {
      await api.patch(`/appointments/${appointmentId}/cancel`)
      toast.success('Session cancelled.')
      await loadAppointments()
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to cancel session'
      toast.error(message)
    }
  }

  const handleAvatarError = (id: string) => {
    setAvatarFallbacks((prev) => ({ ...prev, [id]: true }))
  }

  const getInitials = (name: string) =>
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')

  const getSpecialtyBadge = (specialty: string) => {
    const key = specialty.toLowerCase()
    if (key.includes('anxiety')) return 'bg-[#A8D8C8] text-[var(--text-primary)]'
    if (key.includes('depression')) return 'bg-[#C9B6E4] text-[var(--text-primary)]'
    if (key.includes('trauma')) return 'bg-[#F4B6C2] text-[var(--text-primary)]'
    if (key.includes('relationship')) return 'bg-[#F7C4A5] text-[var(--text-primary)]'
    if (key.includes('cbt')) return 'bg-[#B3D9FF] text-[var(--text-primary)]'
    if (key.includes('sleep')) return 'bg-[#D7C6F8] text-[var(--text-primary)]'
    return 'bg-serenify-lavender/40 text-[var(--text-primary)]'
  }

  const getAvatarBorder = (name: string) => {
    const femaleNames = new Set([
      'Dr. Priya Sharma',
      'Dr. Neha Kapoor',
      'Dr. Sunita Rao',
      'Dr. Ananya Iyer',
    ])
    const maleNames = new Set([
      'Dr. Arjun Mehta',
      'Dr. Rohan Verma',
      'Dr. Vikram Singh',
      'Dr. Kabir Nair',
    ])

    if (femaleNames.has(name)) return 'border-[#E8D5C4]'
    if (maleNames.has(name)) return 'border-[#C4D5E8]'
    return 'border-serenify-lavender/40'
  }

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }).map((_, index) => (
      <span
        key={`star-${index}`}
        className={index < Math.round(rating) ? 'text-amber-400' : 'text-slate-200'}
      >
        ★
      </span>
    ))

  const getStatusBadge = (status: Appointment['status']) => {
    if (status === 'CONFIRMED') return 'bg-emerald-100 text-emerald-700'
    if (status === 'PENDING') return 'bg-amber-100 text-amber-700'
    if (status === 'CANCELLED') return 'bg-rose-100 text-rose-700'
    return 'bg-slate-100 text-slate-700'
  }

  return (
    <div
      className="rounded-[20px] p-6 shadow-[var(--card-shadow)]"
      style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}
    >
      <PageHeader
        title="Therapy"
        subtitle="Find a therapist that aligns with your goals and schedule your next session."        
      />

      <div className="mb-6 flex flex-wrap gap-3">
        {['find', 'sessions'].map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab as 'find' | 'sessions')}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              activeTab === tab
                ? 'bg-serenify-mint text-[var(--text-primary)]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
            }`}
          >
            {tab === 'find' ? 'Find a Therapist' : 'My Sessions'}
          </button>
        ))}
      </div>

      {activeTab === 'find' && (
        <div className="grid gap-5">
          <div className="flex flex-wrap items-center gap-3">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="min-w-[220px] flex-1 rounded-serenify border border-[var(--border-color)] bg-[var(--bg-card)] px-4 py-2 text-sm text-[var(--text-primary)]"
              placeholder="Search by name or specialty"
            />
            <div className="flex flex-wrap gap-2">
              {specialties.map((pill) => (
                <button
                  key={pill}
                  type="button"
                  onClick={() => setActiveFilter(pill)}
                  className={`cursor-pointer rounded-full px-4 py-2 text-xs font-semibold transition ${
                    activeFilter === pill
                        ? 'bg-[#A8D8C8] font-bold text-[var(--text-primary)]'
                        : 'border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-secondary)]'
                  }`}
                >
                  {pill}
                </button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={`loading-${index}`}
                  className="h-40 rounded-serenify-lg bg-serenify-lavender/20 animate-pulse"
                />
              ))}
            </div>
          ) : therapistError ? (
            <div className="rounded-serenify-lg border border-serenify-peach/40 bg-serenify-peach/20 p-6 text-sm text-[var(--text-primary)]">
              <p className="font-semibold">We couldn’t load therapists.</p>
              <p className="mt-1 text-[var(--text-secondary)]">{therapistError}</p>
              <button
                type="button"
                onClick={() => void loadTherapists()}
                className="mt-4 rounded-full bg-[linear-gradient(135deg,_#A8D8C8,_#8FC9B5)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
              >
                Retry
              </button>
            </div>
          ) : filteredTherapists.length === 0 ? (
            <div className="rounded-serenify-lg border border-[var(--border-color)] bg-[var(--bg-card)] p-6 text-sm text-[var(--text-secondary)]">
              No therapists found. Try a different search or filter.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {filteredTherapists.map((therapist) => (
                <div
                  key={therapist.id}
                  className="flex flex-col gap-4 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]"
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-16 w-16 overflow-hidden rounded-full border-2 bg-serenify-lavender/30 ${getAvatarBorder(
                        therapist.name,
                      )}`}
                    >
                      {therapist.avatarUrl && !avatarFallbacks[therapist.id] ? (
                        <img
                          src={therapist.avatarUrl}
                          alt={therapist.name}
                          className="h-full w-full object-cover"
                          onError={() => handleAvatarError(therapist.id)}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-serenify-mint/40 text-sm font-semibold text-[var(--text-primary)]">
                          {getInitials(therapist.name)}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-[18px] font-bold text-[var(--text-primary)]">
                          {therapist.name}
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          <div className="flex items-center gap-0.5">
                            {renderStars(therapist.rating)}
                          </div>
                          <span className="text-[var(--text-muted)]">
                            {therapist.rating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getSpecialtyBadge(
                            therapist.specialty,
                          )}`}
                        >
                          {therapist.specialty}
                        </span>
                        <span className="text-xs text-[var(--text-muted)]">
                          {therapist.experience} years experience
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                    {therapist.bio}
                  </p>

                  <div className="flex items-center justify-between">
                    <p className="text-base font-semibold text-emerald-600">
                      ₹{therapist.price} / session
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => void openProfile(therapist)}
                    className="mt-auto w-full rounded-full border border-serenify-mint/60 px-4 py-2 text-sm font-semibold text-[var(--text-primary)] transition hover:bg-serenify-mint/10"
                  >
                    View Profile
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sessions' && (
        <div className="grid gap-6">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Upcoming sessions
            </h3>
            <div className="mt-3 grid gap-4">
              {appointmentError ? (
                <div className="rounded-serenify-lg border border-serenify-peach/40 bg-serenify-peach/20 p-4 text-sm text-[var(--text-primary)]">
                  <p className="font-semibold">We couldn’t load sessions.</p>
                  <p className="mt-1 text-[var(--text-secondary)]">{appointmentError}</p>
                  <button
                    type="button"
                    onClick={() => void loadAppointments()}
                    className="mt-3 rounded-full bg-serenify-mint px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
                  >
                    Retry
                  </button>
                </div>
              ) : upcoming.length === 0 ? (
                <div className="rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-6">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">📅</span>
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        No upcoming sessions
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-secondary)]">
                        Book your first therapy session to get started.
                      </p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('find')}
                        className="mt-3 rounded-full bg-serenify-mint px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
                      >
                        Find a Therapist
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                upcoming.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-16 w-16 overflow-hidden rounded-full border-2 bg-serenify-lavender/30 ${getAvatarBorder(
                          session.therapist.name,
                        )}`}
                      >
                        {session.therapist.avatarUrl ? (
                          <img
                            src={session.therapist.avatarUrl}
                            alt={session.therapist.name}
                            className="h-full w-full object-cover"
                            onError={() => handleAvatarError(session.therapist.id)}
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
                            {getInitials(session.therapist.name)}
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[var(--text-primary)]">
                            {session.therapist.name}
                          </p>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${getSpecialtyBadge(
                              session.therapist.specialty,
                            )}`}
                          >
                            {session.therapist.specialty}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--text-secondary)]">
                          {formatSessionDate(session.datetime)}
                        </p>
                        <p className="text-xs text-[var(--text-muted)]">
                          {formatSessionTime(session.datetime)} · {formatCountdown(session.datetime)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--border-color)] px-3 py-1 text-[10px] font-semibold text-[var(--text-secondary)]">
                        {session.type}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold ${getStatusBadge(
                          session.status,
                        )}`}
                      >
                        {session.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => toast('Session link will be available soon.')}
                        disabled={session.status === 'PENDING'}
                        className={`rounded-full px-4 py-2 text-xs font-semibold ${
                          session.status === 'PENDING'
                            ? 'cursor-not-allowed bg-[var(--border-color)] text-[var(--text-muted)]'
                            : 'bg-serenify-mint text-[var(--text-primary)]'
                        }`}
                      >
                        Join Session
                      </button>
                      <button
                        type="button"
                        onClick={() => setCancelTarget(session)}
                        className="rounded-full border border-rose-300 px-4 py-2 text-xs font-semibold text-rose-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Past sessions
            </h3>
            <div className="mt-3 grid gap-4">
              {appointmentError ? (
                <div className="rounded-serenify-lg border border-serenify-peach/40 bg-serenify-peach/20 p-4 text-sm text-[var(--text-primary)]">
                  <p className="font-semibold">We couldn’t load sessions.</p>
                  <p className="mt-1 text-[var(--text-secondary)]">{appointmentError}</p>
                  <button
                    type="button"
                    onClick={() => void loadAppointments()}
                    className="mt-3 rounded-full bg-serenify-mint px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
                  >
                    Retry
                  </button>
                </div>
              ) : past.length === 0 ? (
                <p className="text-sm text-[var(--text-secondary)]">
                  No past sessions yet.
                </p>
              ) : (
                past.map((session) => (
                  <div
                    key={session.id}
                    className="flex flex-wrap items-center justify-between gap-4 rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-4 shadow-[var(--card-shadow)]"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {session.therapist.name}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {formatSessionDate(session.datetime)}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {formatSessionTime(session.datetime)} · {session.type}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-semibold ${getStatusBadge(
                          session.status,
                        )}`}
                      >
                        {session.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => void openProfile(session.therapist)}
                        className="rounded-full border border-serenify-mint/60 px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
                      >
                        Book Again
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-serenify-charcoal/40 px-4">
          <div className="w-full max-w-md rounded-[16px] border border-[var(--border-color)] bg-[var(--bg-card)] p-6 shadow-[var(--card-shadow)]">
            <h4 className="text-lg font-semibold text-[var(--text-primary)]">
              Cancel session?
            </h4>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Are you sure you want to cancel this session? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelTarget(null)}
                className="rounded-full border border-[var(--border-color)] px-4 py-2 text-xs font-semibold text-[var(--text-primary)]"
              >
                Keep Session
              </button>
              <button
                type="button"
                onClick={() => {
                  void handleCancel(cancelTarget.id)
                  setCancelTarget(null)
                }}
                className="rounded-full bg-rose-500 px-4 py-2 text-xs font-semibold text-white"
              >
                Cancel Session
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTherapist && (
        <TherapistModal
          therapist={selectedTherapist}
          onClose={closeProfile}
          onBooked={loadAppointments}
          rescheduleId={rescheduleId}
          initialNotes={rescheduleNotes}
          initialType={rescheduleType}
        />
      )}

    </div>
  )
}
