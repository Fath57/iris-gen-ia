// Indicateur "Iris écrit…" : 3 points qui pulsent en cascade, alignés à
// gauche pour matcher le rendu d'un message assistant.

import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'

const DOTS = [0, 1, 2]
const STEP_MS = 250

export function TypingIndicator() {
  const theme = useTheme()
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % DOTS.length), STEP_MS)
    return () => clearInterval(id)
  }, [])

  return (
    <View style={{ flexDirection: 'row', gap: theme.spacing.sm, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md }}>
      {DOTS.map((i) => {
        const active = tick === i
        return (
          <View
            key={i}
            style={{
              backgroundColor: theme.colors.accent,
              borderRadius: theme.radius.full,
              height: 10,
              opacity: active ? 1 : 0.3,
              transform: [{ scale: active ? 1.1 : 0.8 }],
              width: 10,
            }}
          />
        )
      })}
    </View>
  )
}
