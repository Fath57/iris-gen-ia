import type { FontSize, FontWeight } from '@theme/typography'
import type { TextProps as RNTextProps } from 'react-native'
import { useTheme } from '@theme/ThemeProvider'
import { Text as RNText } from 'react-native'

type ColorRole = 'primary' | 'secondary' | 'muted' | 'accent' | 'danger' | 'inverse'

interface Props extends RNTextProps {
  size?: FontSize
  weight?: FontWeight
  color?: ColorRole
}

export function Text({ size = 'base', weight = 'regular', color = 'primary', style, ...rest }: Props) {
  const theme = useTheme()
  const colorMap: Record<ColorRole, string> = {
    primary: theme.colors.textPrimary,
    secondary: theme.colors.textSecondary,
    muted: theme.colors.textMuted,
    accent: theme.colors.accent,
    danger: theme.colors.danger,
    inverse: theme.colors.textInverse,
  }
  return (
    <RNText
      style={[
        {
          color: colorMap[color],
          fontSize: theme.fontSizes[size],
          fontWeight: theme.fontWeights[weight],
        },
        style,
      ]}
      {...rest}
    />
  )
}
