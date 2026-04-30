import { useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/atoms'
import { useTheme } from '@/theme/ThemeProvider'

export default function ConversationScreen() {
  const theme = useTheme()
  const { id } = useLocalSearchParams<{ id: string }>()
  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <View style={{ flex: 1, padding: theme.spacing.xl }}>
        <Text size="xl" weight="bold">Conversation</Text>
        <Text color="muted" style={{ marginTop: theme.spacing.xs }}>
          id :
          {' '}
          {id}
        </Text>
        <Text color="secondary" style={{ marginTop: theme.spacing.md }}>
          Vue conversation existante — implémenté dans feat/chat.
        </Text>
      </View>
    </SafeAreaView>
  )
}
