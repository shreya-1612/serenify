export type ExerciseCategory =
  | 'BREATHING'
  | 'MEDITATION'
  | 'GROUNDING'
  | 'JOURNALING'
  | 'SLEEP'

export type Exercise = {
  id: string
  title: string
  category: ExerciseCategory
  duration: number
  difficulty: number
  description: string
  content: {
    steps?: string[]
    tips?: string[]
    prompts?: string[]
  }
  thumbnailUrl?: string | null
  isSeeded: boolean
}

export type ExerciseLog = {
  id: string
  completedAt: string
  durationMinutes: number
  notes?: string | null
  exercise: Exercise
}
