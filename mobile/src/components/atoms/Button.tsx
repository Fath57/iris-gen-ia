import type { PressableProps } from 'react-native'
import { useTheme } from '@theme/ThemeProvider'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { Text } from './Text'

type Variant = 'primary' | 'secondary' | 'ghost'

interface Props extends Omit<PressableProps, 'children' | 'style'> {
  label: string
  variant?: Variant
  loading?: boolean
  fullWidth?: boolean
}

export function Button({ label, variant = 'primary', loading, fullWidth, disabled, ...rest }: Props) {
  const theme = useTheme()
  const isDisabled = disabled || loading

  const bgByVariant: Record<Variant, string> = {
    primary: theme.colors.accent,
    secondary: theme.colors.surfaceElevated,
    ghost: 'transparent',
  }
  const pressedBgByVariant: Record<Variant, string> = {
    primary: theme.colors.accentPressed,
    secondary: theme.colors.surfacePressed,
    ghost: theme.colors.surface,
  }
  const textColor = variant === 'primary' ? 'inverse' : 'primary'

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? pressedBgByVariant[variant] : bgByVariant[variant],
        borderRadius: theme.radius.lg,
        flexDirection: 'row',
        height: 52,
        justifyContent: 'center',
        opacity: isDisabled ? 0.5 : 1,
        paddingHorizontal: theme.spacing.xl,
        width: fullWidth ? '100%' : undefined,
      })}
      {...rest}
    >
      {loading
        ? <ActivityIndicator color={variant === 'primary' ? theme.colors.textInverse : theme.colors.textPrimary} />
        : (
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
              <Text color={textColor} weight="semibold">{label}</Text>
            </View>
          )}
    </Pressable>
  )
}
