import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/atoms'
import { useTheme } from '@/theme/ThemeProvider'

export default function LoginScreen() {
  const theme = useTheme()
  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.xl }}>
        <Text size="2xl" weight="bold">Bienvenue sur Iris</Text>
        <Text color="secondary" style={{ marginTop: theme.spacing.sm }}>
          Écran de connexion par email — sera implémenté dans feat/auth.
        </Text>
      </View>
    </SafeAreaView>
  )
}
