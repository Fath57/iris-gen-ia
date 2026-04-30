// Row d'une conversation dans la liste d'historique.
// Affiche titre, preview du dernier message, date relative, badge document.

import type { Conversation } from '@/types/conversation'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/atoms'
import { formatRelativeDate } from '@/lib/format'
import { useTheme } from '@/theme/ThemeProvider'

interface Props {
  conversation: Conversation
  onPress: () => void
}

export function ConversationItem({ conversation, onPress }: Props) {
  const theme = useTheme()
  const hasDocument = !!conversation.document
  const preview = conversation.lastMessagePreview ?? (hasDocument ? 'Document prêt à analyser' : 'Aucun message')

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? theme.colors.surfacePressed : theme.colors.bg,
        flexDirection: 'row',
        gap: theme.spacing.md,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
      })}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: hasDocument ? theme.colors.accentMuted : theme.colors.surface,
          borderRadius: theme.radius.md,
          height: 44,
          justifyContent: 'center',
          width: 44,
        }}
      >
        <Ionicons
          name={hasDocument ? 'document-text-outline' : 'chatbubble-ellipses-outline'}
          size={22}
          color={hasDocument ? theme.colors.accent : theme.colors.textSecondary}
        />
      </View>

      <View style={{ flex: 1, gap: theme.spacing.xs }}>
        <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.sm }}>
          <Text numberOfLines={1} style={{ flex: 1 }} weight="semibold">
            {conversation.title}
          </Text>
          <Text color="muted" size="xs">
            {formatRelativeDate(conversation.updatedAt)}
          </Text>
        </View>
        <Text color="secondary" numberOfLines={1} size="sm">
          {preview}
        </Text>
      </View>
    </Pressable>
  )
}
