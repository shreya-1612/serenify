export const backgroundThemeStorageKey = 'serenify-bg-theme'

export type BackgroundThemeName =
  | 'serenify'
  | 'ocean'
  | 'forest'
  | 'sunset'
  | 'lavender'
  | 'midnight'

type BackgroundThemeOption = {
  key: BackgroundThemeName
  name: string
  gradient: string
  bodyClassName?: string
}

export const backgroundThemeOptions: BackgroundThemeOption[] = [
  {
    key: 'serenify',
    name: 'Serenify',
    gradient: 'linear-gradient(135deg, #F7F5FF 0%, #F0F8F4 50%, #FFF4F0 100%)',
  },
  {
    key: 'ocean',
    name: 'Ocean Calm',
    gradient: 'linear-gradient(135deg, #E0F4FF 0%, #B3E5FC 30%, #E0F7FA 100%)',
    bodyClassName: 'theme-ocean',
  },
  {
    key: 'forest',
    name: 'Forest Breath',
    gradient: 'linear-gradient(135deg, #E8F5E9 0%, #F1F8E9 50%, #E0F2F1 100%)',
    bodyClassName: 'theme-forest',
  },
  {
    key: 'sunset',
    name: 'Sunset Peace',
    gradient: 'linear-gradient(135deg, #FFF3E0 0%, #FCE4EC 50%, #F3E5F5 100%)',
  },
  {
    key: 'lavender',
    name: 'Lavender Dream',
    gradient: 'linear-gradient(135deg, #EDE7F6 0%, #F3E5F5 50%, #E8EAF6 100%)',
    bodyClassName: 'theme-lavender',
  },
  {
    key: 'midnight',
    name: 'Midnight Zen',
    gradient: 'linear-gradient(135deg, #0F0B1E 0%, #1A1535 50%, #0F1B2E 100%)',
  },
]

const backgroundThemeMap = new Map(
  backgroundThemeOptions.map((option) => [option.key, option]),
)

const animatedThemeClassNames = backgroundThemeOptions
  .map((option) => option.bodyClassName)
  .filter((className): className is string => Boolean(className))

const normalizeTheme = (value: string | null): BackgroundThemeName => {
  if (!value) return 'serenify'
  return backgroundThemeMap.has(value as BackgroundThemeName)
    ? (value as BackgroundThemeName)
    : 'serenify'
}

export const applyBackgroundTheme = (themeName: BackgroundThemeName) => {
  if (typeof document === 'undefined') return

  const root = document.documentElement
  const body = document.body
  const theme = backgroundThemeMap.get(themeName) ?? backgroundThemeOptions[0]

  root.setAttribute('data-theme', theme.key)

  body.classList.remove(...animatedThemeClassNames)
  if (theme.bodyClassName) {
    body.classList.add(theme.bodyClassName)
  }

  body.setAttribute('data-bg-theme', theme.key)
  body.style.backgroundColor = 'var(--bg-primary)'
  body.style.color = 'var(--text-primary)'
}

export const loadStoredBackgroundTheme = (): BackgroundThemeName => {
  if (typeof window === 'undefined') return 'serenify'
  return normalizeTheme(window.localStorage.getItem(backgroundThemeStorageKey))
}

export const setBackgroundTheme = (themeName: BackgroundThemeName) => {
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(backgroundThemeStorageKey, themeName)
  }
  applyBackgroundTheme(themeName)
}

export const initializeBackgroundTheme = (): BackgroundThemeName => {
  const themeName = loadStoredBackgroundTheme()
  applyBackgroundTheme(themeName)
  return themeName
}
