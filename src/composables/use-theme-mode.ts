export type ThemePreference = 'system' | 'dark' | 'light'
export type ResolvedTheme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'imba97-theme-preference'

const themePreference = useStorage<ThemePreference>(THEME_STORAGE_KEY, 'system')
const preferredDark = usePreferredDark()
const resolvedTheme = computed<ResolvedTheme>(() => {
  if (themePreference.value === 'system')
    return preferredDark.value ? 'dark' : 'light'
  return themePreference.value
})

let initialized = false

function applyTheme(theme: ResolvedTheme) {
  if (typeof document === 'undefined')
    return

  const html = document.documentElement
  html.classList.toggle('dark', theme === 'dark')
}

function setThemePreference(nextTheme: ThemePreference) {
  themePreference.value = nextTheme
}

function cycleThemeMode() {
  if (themePreference.value === 'system') {
    setThemePreference('dark')
    return
  }

  if (themePreference.value === 'dark') {
    setThemePreference('light')
    return
  }

  setThemePreference('system')
}

function setupThemeMode() {
  if (initialized)
    return

  initialized = true

  watch(resolvedTheme, theme => applyTheme(theme), { immediate: true })
}

export function useThemeMode() {
  setupThemeMode()

  return {
    themePreference: readonly(themePreference),
    resolvedTheme: readonly(resolvedTheme),
    setThemePreference,
    cycleThemeMode
  }
}
