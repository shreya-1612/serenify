export type ChecklistFrequency = 'DAILY' | 'WEEKLY'

export type ChecklistItem = {
  id: string
  label: string
  emoji: string
  frequency: ChecklistFrequency
  isDefault: boolean
  isActive: boolean
  streak: number
  createdAt: string
  isCompleted: boolean
  difficulty: number
}

export type ChecklistResponse = {
  date: string
  total: number
  completed: number
  items: ChecklistItem[]
}
