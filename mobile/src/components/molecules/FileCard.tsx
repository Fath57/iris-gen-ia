// FileCard : affiche un document attaché à la conversation.
// Variante compact réduit padding et taille de police pour le header de chat.

import type { FileAttachment } from '@/types/conversation'
import { Ionicons } from '@expo/vector-icons'
import { Pressable, View } from 'react-native'
import { Text } from '@/components/atoms'
import { useTheme } from '@/theme/ThemeProvider'

interface Props {
  file: FileAttachment
  compact?: boolean
  onRemove?: () => void
}

function humanizeSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`
}

export function FileCard({ file, compact, onRemove }: Props) {
  const theme = useTheme()
  const padding = compact ? theme.spacing.sm : theme.spacing.md
  const iconSize = compact ? 20 : 24

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.surfaceElevated,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        flexDirection: 'row',
        gap: theme.spacing.md,
        padding,
      }}
    >
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.accentMuted,
          borderRadius: theme.radius.md,
          height: iconSize + 16,
          justifyContent: 'center',
          width: iconSize + 16,
        }}
      >
        <Ionicons name="document-text-outline" size={iconSize} color={theme.colors.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          size={compact ? 'sm' : 'base'}
          weight="medium"
        >
          {file.name}
        </Text>
        <Text color="muted" size="xs">
          {file.chunksCount !== undefined ? `${file.chunksCount} chunks` : humanizeSize(file.size)}
        </Text>
      </View>

      {onRemove
        ? (
            <Pressable
              hitSlop={8}
              onPress={onRemove}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? theme.colors.surfacePressed : 'transparent',
                borderRadius: theme.radius.full,
                height: 32,
                justifyContent: 'center',
                width: 32,
              })}
            >
              <Ionicons name="close" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          )
        : null}
    </View>
  )
}
