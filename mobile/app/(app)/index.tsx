import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/atoms'
import { useTheme } from '@/theme/ThemeProvider'

// Écran chat par défaut. À l'arrivée, l'utilisateur peut directement uploader
// un fichier puis poser des questions, sans créer de conversation au préalable.
export default function ChatHomeScreen() {
  const theme = useTheme()
  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.xl }}>
        <Text size="2xl" weight="bold">Iris</Text>
        <Text color="secondary" style={{ marginTop: theme.spacing.sm }}>
          Écran chat par défaut — sera implémenté dans feat/chat.
        </Text>
      </View>
    </SafeAreaView>
  )
}
