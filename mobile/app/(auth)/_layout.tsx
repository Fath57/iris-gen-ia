import { Stack } from 'expo-router'

// initialRouteName empêche `otp` d'être restaurée comme route d'entrée
// à froid (reload Metro / deep-link), ce qui faisait fire le redirect
// avant que le root navigator ne soit committé.
export const unstable_settings = {
  initialRouteName: 'login',
}

export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
}
