import type { Colors } from './colors'

import { darkColors, lightColors } from './colors'
import { radius } from './radius'
import { spacing } from './spacing'
import { fontSizes, fontWeights, lineHeights } from './typography'

export type ThemeMode = 'dark' | 'light'

export interface Theme {
  mode: ThemeMode
  colors: Colors
  spacing: typeof spacing
  radius: typeof radius
  fontSizes: typeof fontSizes
  fontWeights: typeof fontWeights
  lineHeights: typeof lineHeights
}

export const darkTheme: Theme = {
  mode: 'dark',
  colors: darkColors,
  spacing,
  radius,
  fontSizes,
  fontWeights,
  lineHeights,
}

export const lightTheme: Theme = {
  mode: 'light',
  colors: lightColors,
  spacing,
  radius,
  fontSizes,
  fontWeights,
  lineHeights,
}

export { darkColors, lightColors } from './colors'
export { radius } from './radius'
export { spacing } from './spacing'
export { fontSizes, fontWeights, lineHeights } from './typography'
