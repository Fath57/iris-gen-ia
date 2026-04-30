// Barre d'entrée du chat : input multiline qui grandit, bouton attach
// (📎) à gauche, bouton send (↑) à droite. Le bouton send n'est actif que
// si l'input n'est pas vide ET que rien n'est en cours d'envoi.

import { Ionicons } from '@expo/vector-icons'
import { useState } from 'react'
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'

interface Props {
  onSend: (content: string) => void
  onAttach?: () => void
  disabled?: boolean
  sending?: boolean
  placeholder?: string
  attachDisabled?: boolean
}

const MAX_INPUT_HEIGHT = 140
const MIN_INPUT_HEIGHT = 48

export function ChatInputBar({
  onSend,
  onAttach,
  disabled,
  sending,
  placeholder = 'Posez une question…',
  attachDisabled,
}: Props) {
  const theme = useTheme()
  const [text, setText] = useState('')
  const [inputHeight, setInputHeight] = useState(MIN_INPUT_HEIGHT)

  const trimmed = text.trim()
  const canSend = trimmed.length > 0 && !sending && !disabled

  function handleSend() {
    if (!canSend) return
    onSend(trimmed)
    setText('')
    setInputHeight(MIN_INPUT_HEIGHT)
  }

  return (
    <View
      style={{
        alignItems: 'flex-end',
        backgroundColor: theme.colors.surface,
        borderColor: theme.colors.border,
        borderRadius: theme.radius.xl,
        borderWidth: 1,
        flexDirection: 'row',
        gap: theme.spacing.sm,
        marginHorizontal: theme.spacing.lg,
        marginBottom: theme.spacing.lg,
        padding: theme.spacing.xs,
      }}
    >
      {onAttach
        ? (
            <Pressable
              disabled={attachDisabled}
              hitSlop={8}
              onPress={onAttach}
              style={({ pressed }) => ({
                alignItems: 'center',
                backgroundColor: pressed ? theme.colors.surfacePressed : 'transparent',
                borderRadius: theme.radius.full,
                height: 40,
                justifyContent: 'center',
                opacity: attachDisabled ? 0.4 : 1,
                width: 40,
              })}
            >
              <Ionicons name="add" size={24} color={theme.colors.textSecondary} />
            </Pressable>
          )
        : null}

      <TextInput
        editable={!disabled}
        multiline
        placeholder={placeholder}
        placeholderTextColor={theme.colors.textMuted}
        value={text}
        onChangeText={setText}
        onContentSizeChange={(e) => {
          const next = Math.min(Math.max(e.nativeEvent.contentSize.height, MIN_INPUT_HEIGHT), MAX_INPUT_HEIGHT)
          setInputHeight(next)
        }}
        style={{
          color: theme.colors.textPrimary,
          flex: 1,
          fontSize: theme.fontSizes.base,
          height: inputHeight,
          paddingHorizontal: theme.spacing.sm,
          paddingTop: theme.spacing.md,
          paddingBottom: theme.spacing.md,
          textAlignVertical: 'top',
        }}
      />

      <Pressable
        disabled={!canSend}
        hitSlop={8}
        onPress={handleSend}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: canSend
            ? (pressed ? theme.colors.accentPressed : theme.colors.accent)
            : theme.colors.surfacePressed,
          borderRadius: theme.radius.full,
          height: 40,
          justifyContent: 'center',
          width: 40,
        })}
      >
        {sending
          ? <ActivityIndicator size="small" color={theme.colors.textInverse} />
          : (
              <Ionicons
                name="arrow-up"
                size={22}
                color={canSend ? theme.colors.textInverse : theme.colors.textMuted}
              />
            )}
      </Pressable>
    </View>
  )
}
