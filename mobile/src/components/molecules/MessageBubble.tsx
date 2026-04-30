// MessageBubble : variante user (bulle alignée à droite, surface elevated)
// et variante assistant (flush left, markdown rendu, pas de bulle).
// Le statut 'sending' baisse l'opacité, 'failed' colore le texte en danger.

import type { Message } from '@/types/conversation'
import { useMemo } from 'react'
import { View } from 'react-native'
import Markdown from 'react-native-markdown-display'
import { Text } from '@/components/atoms'
import { useTheme } from '@/theme/ThemeProvider'

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const theme = useTheme()
  const isUser = message.role === 'user'
  const isSending = message.status === 'sending'
  const isFailed = message.status === 'failed'

  const markdownStyles = useMemo(
    () => ({
      body: {
        color: theme.colors.textPrimary,
        fontSize: theme.fontSizes.base,
        lineHeight: theme.fontSizes.base * theme.lineHeights.relaxed,
      },
      code_inline: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.sm,
        color: theme.colors.accent,
        fontFamily: 'Courier',
        paddingHorizontal: 4,
        paddingVertical: 2,
      },
      code_block: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        color: theme.colors.textPrimary,
        fontFamily: 'Courier',
        padding: theme.spacing.md,
      },
      fence: {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.radius.md,
        color: theme.colors.textPrimary,
        fontFamily: 'Courier',
        padding: theme.spacing.md,
      },
      link: { color: theme.colors.accent },
      heading1: { color: theme.colors.textPrimary, fontSize: theme.fontSizes.xl, fontWeight: theme.fontWeights.bold, marginBottom: theme.spacing.sm },
      heading2: { color: theme.colors.textPrimary, fontSize: theme.fontSizes.lg, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.sm },
      heading3: { color: theme.colors.textPrimary, fontSize: theme.fontSizes.base, fontWeight: theme.fontWeights.semibold, marginBottom: theme.spacing.xs },
      strong: { fontWeight: theme.fontWeights.semibold },
      em: { fontStyle: 'italic' as const },
      list_item: { color: theme.colors.textPrimary, marginBottom: theme.spacing.xs },
      blockquote: {
        backgroundColor: theme.colors.surface,
        borderLeftColor: theme.colors.accent,
        borderLeftWidth: 3,
        marginVertical: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.sm,
      },
    }),
    [theme],
  )

  if (isUser) {
    return (
      <View style={{ alignItems: 'flex-end', paddingHorizontal: theme.spacing.lg }}>
        <View
          style={{
            backgroundColor: theme.colors.surfaceElevated,
            borderRadius: theme.radius.xl,
            maxWidth: '85%',
            opacity: isSending ? 0.6 : 1,
            paddingHorizontal: theme.spacing.lg,
            paddingVertical: theme.spacing.md,
          }}
        >
          <Text color={isFailed ? 'danger' : 'primary'}>{message.content}</Text>
        </View>
      </View>
    )
  }

  return (
    <View style={{ paddingHorizontal: theme.spacing.lg }}>
      <Markdown style={markdownStyles}>{message.content}</Markdown>
    </View>
  )
}
