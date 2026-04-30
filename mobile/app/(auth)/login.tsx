import { useRouter } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Input, Text } from '@/components/atoms'
import { useRequestOtp } from '@/features/auth/hooks'
import { useTheme } from '@/theme/ThemeProvider'

const EMAIL_REGEX = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/

export default function LoginScreen() {
  const theme = useTheme()
  const router = useRouter()
  const [email, setEmail] = useState('')
  const requestOtp = useRequestOtp()

  const trimmed = email.trim().toLowerCase()
  const isValidEmail = EMAIL_REGEX.test(trimmed)
  const errorMessage = requestOtp.isError ? 'Impossible d\'envoyer le code. Réessaie.' : null

  function handleSubmit() {
    if (!isValidEmail || requestOtp.isPending) return
    requestOtp.mutate(
      { email: trimmed },
      {
        onSuccess: () => {
          router.push({ pathname: '/otp', params: { email: trimmed } })
        },
      },
    )
  }

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, gap: theme.spacing['2xl'], justifyContent: 'center', padding: theme.spacing.xl }}>
          <View>
            <Text size="3xl" weight="bold">Iris</Text>
            <Text color="secondary" size="lg" style={{ marginTop: theme.spacing.sm }}>
              Discutez avec vos documents.
            </Text>
          </View>

          <View style={{ gap: theme.spacing.lg }}>
            <View style={{ gap: theme.spacing.sm }}>
              <Text color="secondary" size="sm">Email</Text>
              <Input
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                editable={!requestOtp.isPending}
                keyboardType="email-address"
                placeholder="vous@exemple.com"
                returnKeyType="go"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={handleSubmit}
              />
              {errorMessage
                ? <Text color="danger" size="sm">{errorMessage}</Text>
                : null}
            </View>

            <Button
              fullWidth
              disabled={!isValidEmail}
              label="Recevoir le code"
              loading={requestOtp.isPending}
              onPress={handleSubmit}
            />

            <Text color="muted" size="xs" style={{ textAlign: 'center' }}>
              Un code à 6 chiffres vous sera envoyé.
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
