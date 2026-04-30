// Format de date relative en français. Reste léger : pas d'Intl.RelativeTimeFormat
// pour éviter le polyfill côté Hermes.

export function formatRelativeDate(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.round(diffMs / 1000)
  const diffMin = Math.round(diffSec / 60)
  const diffHour = Math.round(diffMin / 60)
  const diffDay = Math.round(diffHour / 24)

  if (diffSec < 60) return 'à l\'instant'
  if (diffMin < 60) return `il y a ${diffMin} min`
  if (diffHour < 24) return `il y a ${diffHour} h`
  if (diffDay < 7) return `il y a ${diffDay} j`

  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
