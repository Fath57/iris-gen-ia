// Écran historique : liste des conversations triées (mock-server le fait
// par updatedAt desc), tap → /conversation/[id], swipe → supprimer.
// Le bouton + remplace l'écran courant par / pour démarrer une nouvelle conv
// fraîche (remount de l'écran home, donc convId state reset).

import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Spinner, Text } from '@/components/atoms'
import { ConversationList } from '@/components/organisms'
import { useConversations, useDeleteConversation } from '@/features/conversation/hooks'
import { useTheme } from '@/theme/ThemeProvider'

export default function HistoryScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { data, isLoading } = useConversations()
  const deleteConv = useDeleteConversation()

  const conversations = data ?? []

  function handleItemPress(id: string) {
    router.push(`/conversation/${id}`)
  }

  function handleDelete(id: string) {
    deleteConv.mutate(id)
  }

  function handleNew() {
    router.replace('/')
  }

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <Header
        onBack={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        onNew={handleNew}
      />

      {isLoading
        ? (
            <View style={{ alignItems: 'center', flex: 1, justifyContent: 'center' }}>
              <Spinner />
            </View>
          )
        : (
            <ConversationList
              conversations={conversations}
              onItemPress={handleItemPress}
              onDelete={handleDelete}
              emptyState={<EmptyState onNew={handleNew} />}
            />
          )}
    </SafeAreaView>
  )
}

interface HeaderProps {
  onBack: () => void
  onNew: () => void
}

function Header({ onBack, onNew }: HeaderProps) {
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

      <Text style={{ flex: 1 }} weight="semibold">Historique</Text>

      <Pressable
        hitSlop={8}
        onPress={onNew}
        style={({ pressed }) => ({
          alignItems: 'center',
          backgroundColor: pressed ? theme.colors.surfacePressed : 'transparent',
          borderRadius: theme.radius.full,
          height: 40,
          justifyContent: 'center',
          width: 40,
        })}
      >
        <Ionicons name="add" size={24} color={theme.colors.accent} />
      </Pressable>
    </View>
  )
}

interface EmptyStateProps {
  onNew: () => void
}

function EmptyState({ onNew }: EmptyStateProps) {
  const theme = useTheme()
  return (
    <View style={{ alignItems: 'center', gap: theme.spacing.md, paddingHorizontal: theme.spacing.xl }}>
      <View
        style={{
          alignItems: 'center',
          backgroundColor: theme.colors.surface,
          borderRadius: theme.radius['2xl'],
          height: 64,
          justifyContent: 'center',
          width: 64,
        }}
      >
        <Ionicons name="chatbubbles-outline" size={28} color={theme.colors.textSecondary} />
      </View>
      <Text size="lg" weight="semibold">Aucune conversation</Text>
      <Text color="secondary" style={{ textAlign: 'center' }}>
        Commencez une nouvelle conversation depuis l'écran d'accueil.
      </Text>
      <Pressable
        onPress={onNew}
        style={({ pressed }) => ({
          backgroundColor: pressed ? theme.colors.accentPressed : theme.colors.accent,
          borderRadius: theme.radius.lg,
          marginTop: theme.spacing.md,
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.sm,
        })}
      >
        <Text color="inverse" weight="semibold">Nouvelle conversation</Text>
      </Pressable>
    </View>
  )
}
