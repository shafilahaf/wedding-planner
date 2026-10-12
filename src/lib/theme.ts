import { create } from 'zustand'

export type ThemeMode = 'system' | 'light' | 'dark'

const KEY = 'wedding-planner-theme'
const media = window.matchMedia('(prefers-color-scheme: dark)')

const read = (): ThemeMode => {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

/** Puts the `dark` class on <html> and matches the browser/status bar colour. */
function apply(mode: ThemeMode) {
  const dark = mode === 'dark' || (mode === 'system' && media.matches)
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0e0d16' : '#f7f6fb')
  return dark
}

/** Theme is a per-device preference, so it lives in localStorage rather than the synced planner data. */
export const useTheme = create<{ mode: ThemeMode; dark: boolean; setMode: (m: ThemeMode) => void }>((set) => ({
  mode: read(),
  dark: apply(read()),
  setMode: (mode) => {
    try {
      if (mode === 'system') localStorage.removeItem(KEY)
      else localStorage.setItem(KEY, mode)
    } catch {
      /* storage blocked */
    }
    set({ mode, dark: apply(mode) })
  },
}))

media.addEventListener('change', () => {
  const { mode } = useTheme.getState()
  if (mode === 'system') useTheme.setState({ dark: apply(mode) })
})
