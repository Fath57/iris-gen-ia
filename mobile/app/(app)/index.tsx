// Écran chat par défaut. À l'arrivée pas de conversation active : empty
// state avec CTA "Joindre un document". L'attach lazy-crée la conv puis
// y attache le doc. À partir de là, l'input bar est dispo pour les questions.

import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Spinner, Text } from '@/components/atoms'
import { ChatInputBar, FileCard } from '@/components/molecules'
import { MessageList } from '@/components/organisms'
import {
  useAttachDocument,
  useConversation,
  useCreateConversation,
  useMessages,
  useSendMessage,
} from '@/features/conversation/hooks'
import { useDocumentPicker } from '@/features/conversation/useDocumentPicker'
import { useTheme } from '@/theme/ThemeProvider'

export default function ChatHomeScreen() {
  const theme = useTheme()
  const router = useRouter()
  const [conversationId, setConversationId] = useState<string | undefined>()

  const conversation = useConversation(conversationId)
  const messages = useMessages(conversationId)
  const create = useCreateConversation()
  const attach = useAttachDocument()
  const send = useSendMessage()
  const picker = useDocumentPicker()

  const document = conversation.data?.document
  const hasDocument = !!document
  const isAttaching = create.isPending || attach.isPending

  async function handleAttach() {
    const file = await picker.pick()
    if (!file) return

    let id = conversationId
    if (!id) {
      const created = await create.mutateAsync(file.name)
      id = created.id
      setConversationId(id)
    }
    attach.mutate({
      id,
      input: { name: file.name, mimeType: file.mimeType, size: file.size },
    })
  }

  function handleSend(content: string) {
    if (!conversationId) return
    send.mutate({ id: conversationId, input: { content } })
  }

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <Header onOpenHistory={() => router.push('/history')} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1 }}>
          <MessageList
            messages={messages.data ?? []}
            header={hasDocument && document ? <FileCard compact file={document} /> : null}
            emptyState={
              hasDocument
                ? <EmptyHasDocument />
                : <EmptyNoDocument loading={isAttaching} onAttach={handleAttach} />
            }
          />
        </View>

        <ChatInputBar
          attachDisabled={isAttaching}
          disabled={!hasDocument}
          placeholder={hasDocument ? 'Posez une question sur ce document…' : 'Joignez d\'abord un document'}
          sending={send.isPending}
          onAttach={handleAttach}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

interface HeaderProps {
  onOpenHistory: () => void
}

function Header({ onOpenHistory }: HeaderProps) {
  const theme = useTheme()
  return (
    <View
      style={{
        alignItems: 'center',
        borderBottomColor: theme.colors.borderSubtle,
        borderBottomWidth: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
      }}
    >
      <Pressable
        hitSlop={8}
        onPress={onOpenHistory}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? theme.colors.surfacePressed : 'transparent',
          borderRadius: theme.radius.full,
          height: 40,
          justifyContent: 'center',
          width: 40,
        })}
      >
        <Ionicons name="menu" size={22} color={theme.colors.textPrimary} />
      </Pressable>
      <Text weight="semibold">Iris</Text>
      <View style={{ width: 40 }} />
    </View>
  )
}

interface EmptyNoDocumentProps {
  loading?: boolean
  onAttach: () => void
}

function EmptyNoDocument({ loading, onAttach }: EmptyNoDocumentProps) {
  const theme = useTheme()
  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.lg }}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.accentMuted,
          borderRadius: theme.radius['2xl'],
          height: 72,
          justifyContent: 'center',
          width: 72,
        }}
      >
        <Ionicons name="document-text-outline" size={32} color={theme.colors.accent} />
      </View>
      <View style={{ alignItems: 'center', gap: theme.spacing.xs }}>
        <Text size="xl" weight="semibold">Joignez un document</Text>
        <Text color="secondary" style={{ textAlign: 'center' }}>
          Iris analysera son contenu pour répondre à vos questions.
        </Text>
      </View>
      {loading
        ? <Spinner />
        : <Button label="Joindre un document" onPress={onAttach} />}
    </View>
  )
}

function EmptyHasDocument() {
  const theme = useTheme()
  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.sm, paddingTop: theme.spacing.xl }}>
      <Text color="secondary" style={{ textAlign: 'center' }}>
        Document prêt. Posez votre première question ci-dessous.
      </Text>
    </View>
  )
}
