export type User = {
  id: string
  name: string
  email: string
  plan: 'FREE' | 'PREMIUM' | 'ULTIMATE'
  avatar?: string | null
  onboarding?: {
    intents: string[]
    mood: string
    goals: string[]
  }
}

export type AuthResponse = {
  user: User
  accessToken: string
}
