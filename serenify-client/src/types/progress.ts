export type ProgressWeekly = {
  moodBreakdown: Record<'HAPPY' | 'CALM' | 'NEUTRAL' | 'SAD' | 'ANXIOUS', number>
  moodTrend: Array<{ day: string; score: number | null }>
  exerciseByDay: Array<{ day: string; minutes: number }>
  checklistRate: number
  checklistCompletions?: number
  totalExercises: number
  totalMoodLogs: number
  minutesMeditated: number
}
