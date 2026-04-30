import type { TextInputProps } from 'react-native'
import { useTheme } from '@theme/ThemeProvider'
import { useState } from 'react'
import { TextInput } from 'react-native'

export function Input({ style, onFocus, onBlur, ...rest }: TextInputProps) {
  const theme = useTheme()
  const [focused, setFocused] = useState(false)

  return (
    <TextInput
      placeholderTextColor={theme.colors.textMuted}
      onFocus={(e) => {
        setFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setFocused(false)
        onBlur?.(e)
      }}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderColor: focused ? theme.colors.accent : theme.colors.border,
          borderRadius: theme.radius.lg,
          borderWidth: 1,
          color: theme.colors.textPrimary,
          fontSize: theme.fontSizes.base,
          height: 52,
          paddingHorizontal: theme.spacing.lg,
        },
        style,
      ]}
      {...rest}
    />
  )
}
