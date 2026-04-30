// Palette dark-first. Identité Iris : noir profond + accent jaune doré.
// Le mode clair garde la même famille d'accent pour cohérence.

export interface Colors {
  bg: string
  surface: string
  surfaceElevated: string
  surfacePressed: string
  border: string
  borderSubtle: string

  textPrimary: string
  textSecondary: string
  textMuted: string
  textInverse: string

  accent: string
  accentPressed: string
  accentMuted: string

  success: string
  danger: string
  warning: string

  bubbleUser: string
  bubbleAssistant: string

  overlay: string
}

export const darkColors: Colors = {
  bg: '#0A0A0A',
  surface: '#141414',
  surfaceElevated: '#1C1C1C',
  surfacePressed: '#262626',
  border: '#2A2A2A',
  borderSubtle: '#1C1C1C',

  textPrimary: '#FAFAFA',
  textSecondary: '#A3A3A3',
  textMuted: '#6A6A6A',
  textInverse: '#000000',

  accent: '#FDCD38',
  accentPressed: '#E0B520',
  accentMuted: '#3A3520',

  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',

  bubbleUser: '#1C1C1C',
  bubbleAssistant: 'transparent',

  overlay: 'rgba(0, 0, 0, 0.7)',
}

export const lightColors: Colors = {
  bg: '#FFFFFF',
  surface: '#F7F7F7',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#EAEAEA',
  border: '#E5E5E5',
  borderSubtle: '#F0F0F0',

  textPrimary: '#0A0A0A',
  textSecondary: '#525252',
  textMuted: '#A3A3A3',
  textInverse: '#000000',

  accent: '#FDCD38',
  accentPressed: '#E0B520',
  accentMuted: '#FFF7D6',

  success: '#059669',
  danger: '#DC2626',
  warning: '#D97706',

  bubbleUser: '#F0F0F0',
  bubbleAssistant: 'transparent',

  overlay: 'rgba(0, 0, 0, 0.4)',
}
