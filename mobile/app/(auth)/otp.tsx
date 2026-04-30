import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Text } from '@/components/atoms'
import { useTheme } from '@/theme/ThemeProvider'

export default function OtpScreen() {
  const theme = useTheme()
  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <View style={{ flex: 1, justifyContent: 'center', padding: theme.spacing.xl }}>
        <Text size="2xl" weight="bold">Code de vérification</Text>
        <Text color="secondary" style={{ marginTop: theme.spacing.sm }}>
          Saisie du code OTP — sera implémenté dans feat/auth.
        </Text>
      </View>
    </SafeAreaView>
  )
}
