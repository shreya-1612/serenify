import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import ErrorBoundary from './components/ui/ErrorBoundary'
import './index.css'

const preflightThemes = {
  serenify: {
    '--bg-primary': '#F7F5FF',
    '--bg-secondary': '#FFFFFF',
    '--bg-card': '#FFFFFF',
    '--text-primary': '#1A1035',
    '--text-secondary': '#6B6480',
    '--border-color': '#E8E2F8',
  },
  ocean: {
    '--bg-primary': '#E0F4FF',
    '--bg-secondary': '#EDF9FF',
    '--bg-card': '#F5FCFF',
    '--text-primary': '#11394B',
    '--text-secondary': '#3B667B',
    '--border-color': '#B9DFEE',
  },
  forest: {
    '--bg-primary': '#E8F5E9',
    '--bg-secondary': '#F2FAF2',
    '--bg-card': '#F8FDF8',
    '--text-primary': '#1F4A37',
    '--text-secondary': '#4D6E5F',
    '--border-color': '#C4DEC8',
  },
  sunset: {
    '--bg-primary': '#FFF3E0',
    '--bg-secondary': '#FFF8EE',
    '--bg-card': '#FFFDF8',
    '--text-primary': '#573241',
    '--text-secondary': '#7A5664',
    '--border-color': '#F0D6D0',
  },
  lavender: {
    '--bg-primary': '#EDE7F6',
    '--bg-secondary': '#F5F0FA',
    '--bg-card': '#FBF8FF',
    '--text-primary': '#3D2A60',
    '--text-secondary': '#665186',
    '--border-color': '#D5C8EA',
  },
  midnight: {
    '--bg-primary': '#0F0B1E',
    '--bg-secondary': '#1A1535',
    '--bg-card': '#1E1840',
    '--text-primary': '#F0EBF8',
    '--text-secondary': '#9B8CB0',
    '--border-color': '#2A2050',
  },
} as const

type PreflightThemeName = keyof typeof preflightThemes

const normalizeStoredTheme = (value: unknown): PreflightThemeName | null => {
  if (typeof value !== 'string') return null

  if (value in preflightThemes) {
    return value as PreflightThemeName
  }

  if (value === 'dark') return 'midnight'
  if (value === 'light') return 'serenify'

  return null
}

const parseStoredTheme = (): PreflightThemeName => {
  try {
    const raw =
      window.localStorage.getItem('serenify_theme') ??
      window.localStorage.getItem('serenify-theme')

    const normalizedRawTheme = normalizeStoredTheme(raw)
    if (normalizedRawTheme) return normalizedRawTheme

    if (raw) {
      const parsed = JSON.parse(raw)
      const currentTheme = parsed?.state?.theme ?? parsed?.state?.currentTheme
      const normalizedPersistedTheme = normalizeStoredTheme(currentTheme)
      if (normalizedPersistedTheme) return normalizedPersistedTheme
    }
  } catch {
    // Ignore malformed storage and use safe defaults.
  }

  return 'serenify'
}

const parseStoredBackgroundTheme = (): PreflightThemeName => {
  const stored = normalizeStoredTheme(
    window.localStorage.getItem('serenify-bg-theme'),
  )
  if (stored) return stored
  return 'serenify'
}

if (typeof window !== 'undefined') {
  const root = document.documentElement
  const storedTheme = parseStoredTheme()
  const bgTheme = parseStoredBackgroundTheme()
  const activeTheme: PreflightThemeName =
    storedTheme === 'midnight'
      ? 'midnight'
      : bgTheme !== 'serenify'
        ? bgTheme
        : storedTheme
  const vars = preflightThemes[activeTheme]

  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  root.setAttribute('data-theme', activeTheme)
  if (activeTheme === 'midnight') {
    root.classList.add('dark')
  } else {
    root.classList.remove('dark')
  }

  document.body.style.background = ''
  document.body.style.backgroundColor = vars['--bg-primary']
  document.body.style.color = vars['--text-primary']
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <App />
        <Toaster position="top-right" />
      </ErrorBoundary>
    </QueryClientProvider>
  </StrictMode>,
)
