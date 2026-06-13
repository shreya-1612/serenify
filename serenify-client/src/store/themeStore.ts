import { create } from 'zustand'
import { backgroundThemeStorageKey } from '../utils/backgroundTheme'

const storageKey = 'serenify_theme'

export type ThemeName =
  | 'serenify'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'lavender'
  | 'midnight'

type ThemeDefinition = {
  name: ThemeName
  isDark: boolean
  vars: Record<string, string>
}

type ThemeState = {
  theme: ThemeName
  toggle: () => void
  setTheme: (theme: ThemeName) => void
}

export const THEMES: ThemeDefinition[] = [
  {
    name: 'serenify',
    isDark: false,
    vars: {
      '--bg-primary': '#F7F5FF',
      '--bg-secondary': '#FFFFFF',
      '--bg-card': '#FFFFFF',
      '--sidebar-bg': '#F0EDF9',
      '--sidebar-active': '#E8E2F8',
      '--sidebar-active-text': '#6B4EFF',
      '--border-color': '#E8E2F8',
      '--text-primary': '#1A1035',
      '--text-secondary': '#6B6480',
      '--text-muted': '#9B8CB0',
      '--accent-mint': '#3BBFA3',
      '--accent-lavender': '#8B6FBE',
      '--accent-peach': '#F5A623',
      '--card-shadow': '0 2px 12px rgba(107,78,255,0.06)',
      '--card-shadow-hover': '0 8px 24px rgba(107,78,255,0.12)',
    },
  },
  {
    name: 'ocean',
    isDark: false,
    vars: {
      '--bg-primary': '#E0F4FF',
      '--bg-secondary': '#EDF9FF',
      '--bg-card': '#F5FCFF',
      '--sidebar-bg': '#D6F1FF',
      '--sidebar-active': '#BFE8FA',
      '--sidebar-active-text': '#0E5C7E',
      '--border-color': '#B9DFEE',
      '--text-primary': '#11394B',
      '--text-secondary': '#3B667B',
      '--text-muted': '#62859A',
      '--accent-mint': '#3BBFA3',
      '--accent-lavender': '#8B6FBE',
      '--accent-peach': '#F5A623',
      '--card-shadow': '0 2px 12px rgba(14,92,126,0.08)',
      '--card-shadow-hover': '0 8px 24px rgba(14,92,126,0.14)',
    },
  },
  {
    name: 'forest',
    isDark: false,
    vars: {
      '--bg-primary': '#E8F5E9',
      '--bg-secondary': '#F2FAF2',
      '--bg-card': '#F8FDF8',
      '--sidebar-bg': '#DDF0DE',
      '--sidebar-active': '#CCE7CF',
      '--sidebar-active-text': '#2C6F53',
      '--border-color': '#C4DEC8',
      '--text-primary': '#1F4A37',
      '--text-secondary': '#4D6E5F',
      '--text-muted': '#6C8A7C',
      '--accent-mint': '#3BBFA3',
      '--accent-lavender': '#8B6FBE',
      '--accent-peach': '#F5A623',
      '--card-shadow': '0 2px 12px rgba(44,111,83,0.08)',
      '--card-shadow-hover': '0 8px 24px rgba(44,111,83,0.14)',
    },
  },
  {
    name: 'sunset',
    isDark: false,
    vars: {
      '--bg-primary': '#FFF3E0',
      '--bg-secondary': '#FFF8EE',
      '--bg-card': '#FFFDF8',
      '--sidebar-bg': '#FCEBDF',
      '--sidebar-active': '#F8DCD8',
      '--sidebar-active-text': '#8B4E58',
      '--border-color': '#F0D6D0',
      '--text-primary': '#573241',
      '--text-secondary': '#7A5664',
      '--text-muted': '#9A7480',
      '--accent-mint': '#3BBFA3',
      '--accent-lavender': '#8B6FBE',
      '--accent-peach': '#F5A623',
      '--card-shadow': '0 2px 12px rgba(139,78,88,0.08)',
      '--card-shadow-hover': '0 8px 24px rgba(139,78,88,0.14)',
    },
  },
  {
    name: 'lavender',
    isDark: false,
    vars: {
      '--bg-primary': '#EDE7F6',
      '--bg-secondary': '#F5F0FA',
      '--bg-card': '#FBF8FF',
      '--sidebar-bg': '#E2DAF2',
      '--sidebar-active': '#D4C8EB',
      '--sidebar-active-text': '#6A4AA2',
      '--border-color': '#D5C8EA',
      '--text-primary': '#3D2A60',
      '--text-secondary': '#665186',
      '--text-muted': '#8571A3',
      '--accent-mint': '#3BBFA3',
      '--accent-lavender': '#8B6FBE',
      '--accent-peach': '#F5A623',
      '--card-shadow': '0 2px 12px rgba(106,74,162,0.08)',
      '--card-shadow-hover': '0 8px 24px rgba(106,74,162,0.14)',
    },
  },
  {
    name: 'midnight',
    isDark: true,
    vars: {
      '--bg-primary': '#0F0B1E',
      '--bg-secondary': '#1A1535',
      '--bg-card': '#1E1840',
      '--sidebar-bg': '#150F2E',
      '--sidebar-active': '#2A2050',
      '--sidebar-active-text': '#A8D8C8',
      '--border-color': '#2A2050',
      '--text-primary': '#F0EBF8',
      '--text-secondary': '#9B8CB0',
      '--text-muted': '#6B5F80',
      '--accent-mint': '#A8D8C8',
      '--accent-lavender': '#C9B8E8',
      '--accent-peach': '#F5A623',
      '--card-shadow': '0 2px 12px rgba(0,0,0,0.3)',
      '--card-shadow-hover': '0 8px 24px rgba(0,0,0,0.4)',
    },
  },
]

const themeMap = new Map(THEMES.map((theme) => [theme.name, theme]))

const normalizeTheme = (value: unknown): ThemeName | null => {
  if (typeof value !== 'string') return null
  if (themeMap.has(value as ThemeName)) return value as ThemeName
  if (value === 'dark') return 'midnight'
  if (value === 'light') return 'serenify'
  return null
}

export const applyTheme = (themeName: ThemeName) => {
  if (typeof document === 'undefined') return

  const theme = themeMap.get(themeName)
  if (!theme) return

  const root = document.documentElement

  Object.entries(theme.vars).forEach(([key, value]) => {
    root.style.setProperty(key, value)
  })

  root.setAttribute('data-theme', themeName)

  if (theme.isDark) {
    root.classList.add('dark')
    document.body.style.backgroundColor = '#0F0B1E'
    document.body.style.color = theme.vars['--text-primary']
  } else {
    root.classList.remove('dark')
    document.body.style.backgroundColor = theme.vars['--bg-primary']
    document.body.style.color = theme.vars['--text-primary']
    document.body.style.removeProperty('background')
  }
}

const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'serenify'

  const stored =
    localStorage.getItem(storageKey) ?? localStorage.getItem('serenify-theme')

  const normalizedStoredTheme = normalizeTheme(stored)
  if (normalizedStoredTheme) return normalizedStoredTheme

  try {
    const parsed = stored ? JSON.parse(stored) : null
    const fromPersist = parsed?.state?.theme ?? parsed?.state?.currentTheme
    const normalizedPersistedTheme = normalizeTheme(fromPersist)
    if (normalizedPersistedTheme) {
      return normalizedPersistedTheme
    }
  } catch {
    // Ignore malformed persisted state and fall back below.
  }

  const storedBackgroundTheme = normalizeTheme(
    localStorage.getItem(backgroundThemeStorageKey),
  )

  if (storedBackgroundTheme) {
    return storedBackgroundTheme
  }

  return 'serenify'
}

const persistTheme = (theme: ThemeName) => {
  localStorage.setItem(storageKey, theme)
  localStorage.setItem(backgroundThemeStorageKey, theme)
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: getInitialTheme(),
  toggle: () =>
    set((state) => {
      const nextTheme = state.theme === 'midnight' ? 'serenify' : 'midnight'
      persistTheme(nextTheme)
      applyTheme(nextTheme)
      return { theme: nextTheme }
    }),
  setTheme: (theme) => {
    persistTheme(theme)
    applyTheme(theme)
    set({ theme })
  },
}))
