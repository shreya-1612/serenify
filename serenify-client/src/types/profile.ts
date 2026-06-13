export type NotificationPrefs = {
  dailyCheckIn: boolean
  appointmentReminders: boolean
  weeklyProgress: boolean
  tipOfTheDay: boolean
}

export type UserProfile = {
  id: string
  name: string
  email: string
  plan: 'FREE' | 'PREMIUM' | 'ULTIMATE'
  avatar: string | null
  streak: number
  createdAt: string
  reminderTime: string | null
  notificationPrefs: NotificationPrefs | null
}
