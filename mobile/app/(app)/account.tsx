// Écran compte : avatar + email + bouton "Se déconnecter".
// useSignOut clear le token, l'auth-gate redirige automatiquement vers /login.

import { Ionicons } from '@expo/vector-icons'
import { useRouter } from 'expo-router'
import { useMemo } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Avatar, Button, Text } from '@/components/atoms'
import { useSignOut } from '@/features/auth/hooks'
import { useAuthStore } from '@/stores/auth'
import { useTheme } from '@/theme/ThemeProvider'

export default function AccountScreen() {
  const theme = useTheme()
  const router = useRouter()
  const user = useAuthStore(s => s.user)
  const signOut = useSignOut()

  const memberSince = useMemo(() => {
    if (!user) return ''
    return new Date(user.createdAt).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }, [user])

  function handleSignOut() {
    Alert.alert(
      'Se déconnecter ?',
      'Vous devrez ressaisir votre email pour vous reconnecter.',
      [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Se déconnecter', style: 'destructive', onPress: () => signOut.mutate() },
      ],
    )
  }

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: theme.colors.bg, flex: 1 }}>
      <Header onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: theme.spacing.lg }}>
        {user
          ? (
              <>
                <View
                  style={{
                    alignItems: 'center',
                    gap: theme.spacing.md,
                    paddingVertical: theme.spacing['2xl'],
                  }}
                >
                  <Avatar email={user.email} size="lg" />
                  <Text size="lg" weight="semibold">{user.email}</Text>
                  <Text color="muted" size="sm">
                    Membre depuis le
                    {' '}
                    {memberSince}
                  </Text>
                </View>

                <View style={{ flex: 1 }} />

                <Button
                  fullWidth
                  label="Se déconnecter"
                  loading={signOut.isPending}
                  variant="danger"
                  onPress={handleSignOut}
                />
              </>
            )
          : (
              <Text color="secondary" style={{ textAlign: 'center' }}>
                Chargement…
              </Text>
            )}
      </ScrollView>
    </SafeAreaView>
  )
}

interface HeaderProps {
  onBack: () => void
}

function Header({ onBack }: HeaderProps) {
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
      <Text style={{ flex: 1 }} weight="semibold">Compte</Text>
    </View>
  )
}
