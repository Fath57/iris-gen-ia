// Échelle typographique. Police système (SF Pro iOS / Roboto Android) par défaut.
// Une famille custom peut être chargée via expo-font ultérieurement.

export const fontSizes = {
  'xs': 12,
  'sm': 14,
  'base': 16,
  'lg': 18,
  'xl': 22,
  '2xl': 28,
  '3xl': 34,
  '4xl': 42,
} as const

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const

export const lineHeights = {
  tight: 1.2,
  base: 1.4,
  relaxed: 1.6,
} as const

export type FontSize = keyof typeof fontSizes
export type FontWeight = keyof typeof fontWeights
export type LineHeight = keyof typeof lineHeights
