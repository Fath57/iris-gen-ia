// Pattern OTP : un TextInput invisible capte la saisie (paste / SMS autofill iOS),
// les `length` cases sont rendues en lecture seule en miroir de la valeur.
// Bien plus fiable que N TextInputs concurrents (focus, paste cassé, etc).

import { useRef, useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { Text } from '@/components/atoms'
import { useTheme } from '@/theme/ThemeProvider'

interface Props {
  length?: number
  value: string
  onChange: (value: string) => void
  onComplete?: (value: string) => void
  disabled?: boolean
  autoFocus?: boolean
}

export function OtpInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  autoFocus = true,
}: Props) {
  const theme = useTheme()
  const inputRef = useRef<TextInput>(null)
  const [focused, setFocused] = useState(false)

  const digits = Array.from({ length }, (_, i) => value[i] ?? '')

  function handleChange(text: string) {
    const sanitized = text.replace(/\D/g, '').slice(0, length)
    onChange(sanitized)
    if (sanitized.length === length) onComplete?.(sanitized)
  }

  return (
    <Pressable onPress={() => inputRef.current?.focus()} disabled={disabled}>
      <View style={{ flexDirection: 'row', gap: theme.spacing.sm }}>
        {digits.map((digit, i) => {
          const isCurrent = focused && i === value.length && value.length < length
          return (
            <View
              // eslint-disable-next-line react/no-array-index-key -- slots OTP de longueur fixe, l'index est la clé naturelle
              key={i}
              style={{
                alignItems: 'center',
                backgroundColor: theme.colors.surface,
                borderColor: isCurrent ? theme.colors.accent : theme.colors.border,
                borderRadius: theme.radius.lg,
                borderWidth: 1.5,
                flex: 1,
                height: 60,
                justifyContent: 'center',
              }}
            >
              <Text size="xl" weight="semibold">{digit}</Text>
            </View>
          )
        })}
      </View>
      <TextInput
        ref={inputRef}
        autoComplete="sms-otp"
        autoFocus={autoFocus}
        caretHidden
        editable={!disabled}
        keyboardType="number-pad"
        maxLength={length}
        textContentType="oneTimeCode"
        value={value}
        onBlur={() => setFocused(false)}
        onChangeText={handleChange}
        onFocus={() => setFocused(true)}
        style={{
          height: 1,
          opacity: 0,
          position: 'absolute',
          width: 1,
        }}
      />
    </Pressable>
  )
}
