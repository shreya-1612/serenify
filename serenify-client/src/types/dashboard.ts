export type DashboardResponse = {
  user: {
    name: string
    plan: 'FREE' | 'PREMIUM' | 'ULTIMATE'
    streak: number
    avatar: string | null
  }
  todaysMood: {
    mood: 'HAPPY' | 'CALM' | 'NEUTRAL' | 'SAD' | 'ANXIOUS'
    note: string | null
    date: string
  } | null
  dailyQuote: {
    id: string
    text: string
    author: string
    category: string
  } | null
  checklistSummary: {
    total: number
    completed: number
  }
  weeklyStats: {
    exercisesCompleted: number
    sessionCount: number
    minutesMeditated: number
  }
  recentActivity: Array<{
    type: string
    label: string
    at: string
  }>
  streakData: Array<{ date: string; count: number }>
}

export type MoodLog = {
  id: string
  mood: 'HAPPY' | 'CALM' | 'NEUTRAL' | 'SAD' | 'ANXIOUS'
  note: string | null
  date: string
}
