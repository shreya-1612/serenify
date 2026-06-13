import axios, { AxiosError, type AxiosRequestConfig } from 'axios'
import { toast } from 'react-hot-toast'

export type AuthRequestConfig = AxiosRequestConfig & {
  skipAuthRefresh?: boolean
}

type AuthHandlers = {
  getAccessToken: () => string | null
  refreshToken: () => Promise<string | null>
  logout: () => void
}

let handlers: AuthHandlers | null = null
let refreshPromise: Promise<string | null> | null = null

export const setAuthHandlers = (next: AuthHandlers) => {
  handlers = next
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = handlers?.getAccessToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!error.response) {
      toast.error('Connection lost. Retrying...')
    }
    const original = error.config as AxiosRequestConfig & {
      _retry?: boolean
      skipAuthRefresh?: boolean
    }

    if (
      error.response?.status !== 401 ||
      original._retry ||
      original.skipAuthRefresh ||
      original.url?.includes('/auth/refresh') ||
      original.url?.includes('/auth/login')
    ) {
      return Promise.reject(error)
    }

    original._retry = true

    if (!handlers) {
      return Promise.reject(error)
    }

    if (!refreshPromise) {
      refreshPromise = handlers.refreshToken().finally(() => {
        refreshPromise = null
      })
    }

    const newToken = await refreshPromise
    if (!newToken) {
      handlers?.logout()
      return Promise.reject(error)
    }

    original.headers = {
      ...(original.headers || {}),
      Authorization: `Bearer ${newToken}`,
    }

    return api(original)
  },
)
