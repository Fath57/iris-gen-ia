// Pattern OTP : un TextInput pleine zone (opacity 0) sous les cases
// reçoit directement les taps via pointerEvents 'none' sur la rangée
// affichée. Évite les problèmes de focus/keyboard d'un input 1x1
// off-screen, et supporte paste / iOS SMS autofill.

import { useRef, useState } from 'react'
import { TextInput, View } from 'react-native'
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

const BOX_HEIGHT = 60

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
    <View style={{ position: 'relative' }}>
      <View
        // pointerEvents none : les taps passent à travers vers le TextInput
        // qui couvre toute la zone et déclenche le clavier natif.
        pointerEvents="none"
        style={{ flexDirection: 'row', gap: theme.spacing.sm }}
      >
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
                height: BOX_HEIGHT,
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
          backgroundColor: 'transparent',
          color: 'transparent',
          height: BOX_HEIGHT,
          left: 0,
          position: 'absolute',
          right: 0,
          top: 0,
        }}
      />
    </View>
  )
}
