export type Therapist = {
  id: string
  name: string
  specialty: string
  bio: string
  avatarUrl: string | null
  price: number
  rating: number
  experience: number
  availability: unknown
}

export type AvailabilityResponse = {
  therapistId: string
  days: Array<{
    date: string
    slots: string[]
  }>
}

export type AppointmentType = 'VIDEO' | 'CHAT' | 'PHONE'
export type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED'

export type Appointment = {
  id: string
  datetime: string
  type: AppointmentType
  status: AppointmentStatus
  notes: string | null
  therapist: Therapist
}
