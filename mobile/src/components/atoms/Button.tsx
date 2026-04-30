import type { PressableProps } from 'react-native'
import { useTheme } from '@theme/ThemeProvider'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { Text } from './Text'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

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
    danger: 'transparent',
  }
  const pressedBgByVariant: Record<Variant, string> = {
    primary: theme.colors.accentPressed,
    secondary: theme.colors.surfacePressed,
    ghost: theme.colors.surface,
    danger: theme.colors.surface,
  }
  const textColorByVariant: Record<Variant, 'inverse' | 'primary' | 'danger'> = {
    primary: 'inverse',
    secondary: 'primary',
    ghost: 'primary',
    danger: 'danger',
  }
  const textColor = textColorByVariant[variant]
  const borderColor = variant === 'danger' ? theme.colors.danger : 'transparent'
  const borderWidth = variant === 'danger' ? 1 : 0

  return (
    <Pressable
      disabled={isDisabled}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? pressedBgByVariant[variant] : bgByVariant[variant],
        borderColor,
        borderRadius: theme.radius.lg,
        borderWidth,
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
        ? (
            <ActivityIndicator
              color={
                variant === 'primary'
                  ? theme.colors.textInverse
                  : variant === 'danger' ? theme.colors.danger : theme.colors.textPrimary
              }
            />
          )
        : (
            <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
              <Text color={textColor} weight="semibold">{label}</Text>
            </View>
          )}
    </Pressable>
  )
}
