import type { ReactNode } from 'react'
import type { Theme } from './index'
import { createContext, use, useMemo } from 'react'
import { darkTheme, lightTheme } from './index'

// Le mode est figé à dark pour le moment (cf. app.json userInterfaceStyle).
// Le contexte permettra plus tard un toggle utilisateur sans refacto des consommateurs.

interface ThemeContextValue {
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

interface Props {
  mode?: 'dark' | 'light'
  children: ReactNode
}

export function ThemeProvider({ mode = 'dark', children }: Props) {
  const value = useMemo<ThemeContextValue>(
    () => ({ theme: mode === 'dark' ? darkTheme : lightTheme }),
    [mode],
  )
  return <ThemeContext value={value}>{children}</ThemeContext>
}

export function useTheme(): Theme {
  const ctx = use(ThemeContext)
  if (!ctx) throw new Error('useTheme doit être appelé sous <ThemeProvider>')
  return ctx.theme
}
