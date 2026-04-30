import { useTheme } from '@theme/ThemeProvider'
import { ActivityIndicator } from 'react-native'

interface Props {
  size?: 'small' | 'large'
  color?: 'accent' | 'primary' | 'muted'
}

export function Spinner({ size = 'small', color = 'accent' }: Props) {
  const theme = useTheme()
  const colorMap = {
    accent: theme.colors.accent,
    primary: theme.colors.textPrimary,
    muted: theme.colors.textMuted,
  }
  return <ActivityIndicator size={size} color={colorMap[color]} />
}
