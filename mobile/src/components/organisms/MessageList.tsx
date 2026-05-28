// MessageList : FlatList des messages avec auto-scroll vers le bas à
// chaque ajout. Header optionnel (FileCard du document attaché) et
// empty state customisable par le caller.

import type { ReactNode } from 'react'
import type { Message } from '@/types/conversation'
import { useRef } from 'react'
import { FlatList, View } from 'react-native'
import { MessageBubble, TypingIndicator } from '@/components/molecules'
import { useTheme } from '@/theme/ThemeProvider'

interface Props {
  messages: Message[]
  header?: ReactNode
  emptyState?: ReactNode
  loading?: boolean
}

export function MessageList({ messages, header, emptyState, loading }: Props) {
  const theme = useTheme()
  const ref = useRef<FlatList<Message>>(null)

  return (
    <FlatList
      ref={ref}
      data={messages}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <MessageBubble message={item} />}
      ItemSeparatorComponent={() => <View style={{ height: theme.spacing.lg }} />}
      contentContainerStyle={{
        flexGrow: 1,
        paddingVertical: theme.spacing.lg,
      }}
      ListHeaderComponent={
        header
          ? <View style={{ marginBottom: theme.spacing.lg, paddingHorizontal: theme.spacing.lg }}>{header}</View>
          : null
      }
      ListEmptyComponent={
        emptyState
          ? <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: theme.spacing.xl }}>{emptyState}</View>
          : null
      }
      ListFooterComponent={loading ? <TypingIndicator /> : null}
      onContentSizeChange={() => {
        if (messages.length > 0 || loading) ref.current?.scrollToEnd({ animated: true })
      }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    />
  )
}
