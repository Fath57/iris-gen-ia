import type { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { useAuthStore } from '@/stores/auth'
import { ThemeProvider } from '@/theme/ThemeProvider'
import 'react-native-reanimated'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
})

function AuthGate({ children }: { children: ReactNode }) {
  const status = useAuthStore(s => s.status)
  const hydrate = useAuthStore(s => s.hydrate)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    if (status === 'idle' || status === 'loading') return
    const inAuthGroup = segments[0] === '(auth)'
    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/login')
    }
    else if (status === 'authenticated' && inAuthGroup) {
      router.replace('/')
    }
  }, [status, segments, router])

  return <>{children}</>
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider mode="dark">
            <AuthGate>
              <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
              </Stack>
            </AuthGate>
            <StatusBar style="light" />
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}
