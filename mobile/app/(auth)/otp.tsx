import { useLocalSearchParams, useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Button, Text } from '@/components/atoms'
import { OtpInput } from '@/components/molecules'
import { useRequestOtp, useVerifyOtp } from '@/features/auth/hooks'
import { ApiError } from '@/lib/http'
import { useTheme } from '@/theme/ThemeProvider'

const OTP_LENGTH = 6

function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return 'Code invalide.'
    if (error.status === 410) return 'Code expiré, redemandez un envoi.'
  }
  return 'Vérification impossible. Réessaie.'
}

export default function OtpScreen() {
  const theme = useTheme()
  const router = useRouter()
  const { email } = useLocalSearchParams<{ email: string }>()
  const [code, setCode] = useState('')
  const verifyOtp = useVerifyOtp()
  const requestOtp = useRequestOtp()

  const errorMessage = verifyOtp.isError ? getErrorMessage(verifyOtp.error) : null
  const canSubmit = code.length === OTP_LENGTH && !verifyOtp.isPending

  function submit(value: string) {
    if (value.length !== OTP_LENGTH || verifyOtp.isPending || !email) return
    verifyOtp.mutate({ email, code: value })
  }

  function handleResend() {
    if (!email || requestOtp.isPending) return
    setCode('')
    verifyOtp.reset()
    requestOtp.mutate({ email })
  }

  function handleEditEmail() {
    router.back()
  }

  // Sécurité : navigation différée à useEffect pour éviter
  // "Attempted to navigate before mounting the Root Layout".
  useEffect(() => {
    if (!email) router.replace('/login')
  }, [email, router])

  if (!email) return null

  return (
    <SafeAreaView style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, justifyContent: 'space-between', padding: theme.spacing.xl }}>
          <View style={{ marginTop: theme.spacing['3xl'] }}>
            <Text size="2xl" weight="bold">Code de vérification</Text>
            <Text color="secondary" style={{ marginTop: theme.spacing.sm }}>
              Saisissez le code à 6 chiffres envoyé à
              {' '}
              <Text color="primary" weight="medium">{email}</Text>
              .
            </Text>
          </View>

          <View style={{ gap: theme.spacing.lg }}>
            <OtpInput
              autoFocus
              disabled={verifyOtp.isPending}
              length={OTP_LENGTH}
              value={code}
              onChange={setCode}
              onComplete={submit}
            />
            {errorMessage
              ? <Text color="danger" size="sm" style={{ textAlign: 'center' }}>{errorMessage}</Text>
              : null}

            <Button
              fullWidth
              disabled={!canSubmit}
              label="Vérifier"
              loading={verifyOtp.isPending}
              onPress={() => submit(code)}
            />

            <View style={{ alignItems: 'center', flexDirection: 'row', gap: theme.spacing.lg, justifyContent: 'center' }}>
              <Pressable disabled={requestOtp.isPending} onPress={handleResend}>
                <Text color="accent" size="sm">
                  {requestOtp.isPending ? 'Envoi…' : 'Renvoyer le code'}
                </Text>
              </Pressable>
              <Text color="muted">·</Text>
              <Pressable onPress={handleEditEmail}>
                <Text color="secondary" size="sm">Modifier l'email</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
