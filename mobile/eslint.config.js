// Configuration ESLint basée sur @antfu/eslint-config.
// React activé (RN), TypeScript strict, conventions du projet.

// Polyfill Object.groupBy pour Node < 21 (utilisé par eslint-flat-config-utils).
if (typeof Object.groupBy !== 'function') {
  Object.groupBy = function groupBy(items, fn) {
    const result = Object.create(null)
    let i = 0
    for (const item of items) {
      const key = fn(item, i++)
      if (!result[key]) result[key] = []
      result[key].push(item)
    }
    return result
  }
}

const antfu = require('@antfu/eslint-config').default

module.exports = antfu(
  {
    type: 'app',
    typescript: true,
    react: true,
    stylistic: {
      indent: 2,
      quotes: 'single',
      semi: false,
    },
    ignores: [
      'dist/**',
      '.expo/**',
      'node_modules/**',
      'android/**',
      'ios/**',
      'assets/**',
    ],
  },
  {
    rules: {
      // L'app expose ses écrans via export default exigés par expo-router.
      'import/no-default-export': 'off',
      // Pas pertinent dans une app RN avec écrans/atomes nommés simplement.
      'react-refresh/only-export-components': 'off',
      // Les commentaires DOIVENT être en français — pas d'enforcement automatique possible.
      'antfu/if-newline': 'off',
      // Expo expose process.env.EXPO_PUBLIC_* sans import explicite côté RN.
      'node/prefer-global/process': 'off',
    },
  },
)
