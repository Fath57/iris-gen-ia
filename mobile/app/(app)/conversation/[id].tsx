// Écran d'une conversation existante. Identique au chat home mais avec
// un id figé depuis l'URL. Pas de création paresseuse ni d'attach :
// la conversation a déjà son document.

import { Ionicons } from '@expo/vector-icons'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Spinner, Text } from '@/components/atoms'
import { ChatInputBar, FileCard } from '@/components/molecules'
import { MessageList } from '@/components/organisms'
import { useConversation, useMessages, useSendMessage } from '@/features/conversation/hooks'
import { useTheme } from '@/theme/ThemeProvider'

export default function ConversationScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()

  const conversation = useConversation(id)
  const messages = useMessages(id)
  const send = useSendMessage()

  const document = conversation.data?.document

  function handleSend(content: string) {
    if (!id) return
    send.mutate({ id, input: { content } })
  }

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <Header
        title={conversation.data?.title ?? 'Conversation'}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          {conversation.isLoading
            ? (
                <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
                  <Spinner />
                </View>
              )
            : (
                <MessageList
                  messages={messages.data ?? []}
                  header={document ? <FileCard compact file={document} /> : null}
                  emptyState={(
                    <Text color="secondary" style={{ textAlign: 'center' }}>
                      Aucun message dans cette conversation.
                    </Text>
                  )}
                />
              )}
        </View>

        <ChatInputBar
          disabled={!document}
          placeholder="Posez une question…"
          sending={send.isPending}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

interface HeaderProps {
  title: string
  onBack: () => void
}

function Header({ title, onBack }: HeaderProps) {
  const theme = useTheme()
  return (
    <View
      style={{
        alignItems: 'center',
        borderBottomColor: theme.colors.borderSubtle,
        borderBottomWidth: 1,
        flexDirection: 'row',
        gap: theme.spacing.sm,
        paddingHorizontal: theme.spacing.md,
        paddingVertical: theme.spacing.md,
      }}
    >
      <Pressable
        hitSlop={8}
        onPress={onBack}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? theme.colors.surfacePressed : 'transparent',
          borderRadius: theme.radius.full,
          height: 40,
          justifyContent: 'center',
          width: 40,
        })}
      >
        <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
      </Pressable>
      <Text numberOfLines={1} style={{ flex: 1 }} weight="semibold">{title}</Text>
    </View>
  )
}
