import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/auth'
import { ThemeProvider } from '@/theme/ThemeProvider'
import 'react-native-reanimated'

// Empêche le splash de disparaître tant qu'on n'a pas hydraté l'auth :
// évite le flash sur l'écran login avant le redirect si user déjà loggué.
SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignoré : preventAutoHideAsync peut throw si déjà appelé en hot-reload.
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function RootNavigator() {
  const status = useAuthStore(s => s.status)
  const hydrate = useAuthStore(s => s.hydrate)

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (status === 'authenticated' || status === 'unauthenticated') {
      SplashScreen.hideAsync().catch(() => {})
    }
  }, [status])

  const isAuthenticated = status === 'authenticated'

  // Stack.Protected gère le routing déclarativement : changer le guard
  // déclenche la navigation côté router, sans appel impératif risquant
  // de tirer avant mount.
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Protected guard={isAuthenticated}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!isAuthenticated}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  )
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <ThemeProvider mode="dark">
              <RootNavigator />
              <StatusBar style="light" />
            </ThemeProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  )
}
