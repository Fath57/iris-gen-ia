// Avatar simple : cercle avec la première lettre de l'email (uppercase),
// bg accentMuted, lettre en accent. Tailles sm (32) / md (40) / lg (64).

import { View } from 'react-native'
import { useTheme } from '@/theme/ThemeProvider'
import { Text } from './Text'

type Size = 'sm' | 'md' | 'lg'

interface Props {
  email: string
  size?: Size
}

const SIZE_MAP: Record<Size, { box: number, font: 'sm' | 'base' | 'xl' }> = {
  sm: { box: 32, font: 'sm' },
  md: { box: 40, font: 'base' },
  lg: { box: 64, font: 'xl' },
}

export function Avatar({ email, size = 'md' }: Props) {
  const theme = useTheme()
  const { box, font } = SIZE_MAP[size]
  const initial = (email.trim()[0] ?? '?').toUpperCase()

  return (
    <View
      style={{
        alignItems: 'center',
        backgroundColor: theme.colors.accentMuted,
        borderRadius: box / 2,
        height: box,
        justifyContent: 'center',
        width: box,
      }}
    >
      <Text color="accent" size={font} weight="semibold">{initial}</Text>
    </View>
  )
}
