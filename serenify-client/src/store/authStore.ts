import { create } from 'zustand'
import { api, setAuthHandlers, type AuthRequestConfig } from '../services/api'
import type { AuthResponse, User } from '../types/auth'

type AuthState = {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  setAccessToken: (token: string | null) => void
  setUser: (user: User | null) => void
  login: (email: string, password: string) => Promise<void>
  signup: (payload: {
    name: string
    email: string
    password: string
  }) => Promise<void>
  logout: () => Promise<void>
  refreshToken: () => Promise<string | null>
  updateUser: (user: User) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  setAccessToken: (token) =>
    set({ accessToken: token, isAuthenticated: Boolean(token) }),
  setUser: (user) => set({ user }),
  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', {
        email,
        password,
      })
      if (!data.accessToken) {
        throw new Error('Missing access token')
      }
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },
  signup: async ({ name, email, password }) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post<AuthResponse>('/auth/signup', {
        name,
        email,
        password,
      })
      if (!data.accessToken) {
        throw new Error('Missing access token')
      }
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
      set({
        user: data.user,
        accessToken: data.accessToken,
        isAuthenticated: true,
      })
    } finally {
      set({ isLoading: false })
    }
  },
  logout: async () => {
    set({ isLoading: true })
    try {
      await api.post('/auth/logout')
    } finally {
      delete api.defaults.headers.common.Authorization
      set({ user: null, accessToken: null, isAuthenticated: false })
      set({ isLoading: false })
    }
  },
  refreshToken: async () => {
    try {
      const { data } = await api.post<AuthResponse>(
        '/auth/refresh',
        null,
        { skipAuthRefresh: true } as AuthRequestConfig,
      )
      if (!data.accessToken) {
        throw new Error('Missing access token')
      }
      api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
      set({
        accessToken: data.accessToken,
        user: data.user ?? null,
        isAuthenticated: true,
      })
      return data.accessToken
    } catch {
      delete api.defaults.headers.common.Authorization
      set({ user: null, accessToken: null, isAuthenticated: false })
      return null
    }
  },
  updateUser: (user) => {
    set({ user })
  },
}))

setAuthHandlers({
  getAccessToken: () => useAuthStore.getState().accessToken,
  refreshToken: () => useAuthStore.getState().refreshToken(),
  logout: () => void useAuthStore.getState().logout(),
})
