// Liste des conversations avec swipe-to-delete (ReanimatedSwipeable de
// gesture-handler). Confirmation via Alert avant la suppression effective.

import type { ReactNode } from 'react'
import type { Conversation } from '@/types/conversation'
import { Ionicons } from '@expo/vector-icons'
import { Alert, FlatList, Pressable, View } from 'react-native'
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable'
import { ConversationItem } from '@/components/molecules'
import { useTheme } from '@/theme/ThemeProvider'

interface Props {
  conversations: Conversation[]
  onItemPress: (id: string) => void
  onDelete: (id: string) => void
  emptyState?: ReactNode
}

function confirmDelete(conversation: Conversation, onDelete: (id: string) => void) {
  Alert.alert(
    'Supprimer la conversation',
    `« ${conversation.title} » sera supprimée définitivement.`,
    [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Supprimer', style: 'destructive', onPress: () => onDelete(conversation.id) },
    ],
  )
}

interface DeleteActionProps {
  onPress: () => void
}

function DeleteAction({ onPress }: DeleteActionProps) {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        alignItems: 'center',
        backgroundColor: pressed ? '#B91C1C' : theme.colors.danger,
        flexDirection: 'row',
        height: '100%',
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.xl,
      })}
    >
      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
    </Pressable>
  )
}

export function ConversationList({ conversations, onItemPress, onDelete, emptyState }: Props) {
  const theme = useTheme()

  return (
    <FlatList
      data={conversations}
      keyExtractor={c => c.id}
      renderItem={({ item }) => (
        <ReanimatedSwipeable
          friction={2}
          overshootRight={false}
          renderRightActions={() => (
            <DeleteAction onPress={() => confirmDelete(item, onDelete)} />
          )}
          rightThreshold={40}
        >
          <ConversationItem
            conversation={item}
            onPress={() => onItemPress(item.id)}
          />
        </ReanimatedSwipeable>
      )}
      ItemSeparatorComponent={() => (
        <View
          style={{
            backgroundColor: theme.colors.borderSubtle,
            height: 1,
            marginLeft: theme.spacing['3xl'] + theme.spacing.lg,
          }}
        />
      )}
      ListEmptyComponent={
        emptyState
          ? <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center', paddingTop: theme.spacing['3xl'] }}>{emptyState}</View>
          : null
      }
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
    />
  )
}
