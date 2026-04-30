// Palette dark-first inspirée de Claude mobile, accent iris (lavande).
// Le mode clair est défini en parallèle pour un futur switch user-driven.

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
  bg: '#0E0E10',
  surface: '#17171A',
  surfaceElevated: '#1F1F23',
  surfacePressed: '#26262C',
  border: '#2A2A2F',
  borderSubtle: '#1F1F23',

  textPrimary: '#ECECEC',
  textSecondary: '#9B9BA1',
  textMuted: '#6B6B72',
  textInverse: '#0E0E10',

  accent: '#A78BFA',
  accentPressed: '#8B72E0',
  accentMuted: '#3D3261',

  success: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',

  bubbleUser: '#2A2A2F',
  bubbleAssistant: 'transparent',

  overlay: 'rgba(0, 0, 0, 0.6)',
}

export const lightColors: Colors = {
  bg: '#FFFFFF',
  surface: '#F7F7F8',
  surfaceElevated: '#FFFFFF',
  surfacePressed: '#EAEAEC',
  border: '#E5E5E7',
  borderSubtle: '#F0F0F2',

  textPrimary: '#0E0E10',
  textSecondary: '#5A5A60',
  textMuted: '#9B9BA1',
  textInverse: '#FFFFFF',

  accent: '#7C3AED',
  accentPressed: '#6D28D9',
  accentMuted: '#EDE9FE',

  success: '#059669',
  danger: '#DC2626',
  warning: '#D97706',

  bubbleUser: '#F0F0F2',
  bubbleAssistant: 'transparent',

  overlay: 'rgba(0, 0, 0, 0.4)',
}
