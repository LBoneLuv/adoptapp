export function timeAgo(dateString: string): string {
  const date = new Date(dateString)
  const diff = Date.now() - date.getTime()
  const min = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (min < 1) return "ahora"
  if (min < 60) return `hace ${min} min`
  if (hours < 24) return `hace ${hours} h`
  if (days < 30) return `hace ${days} d`
  return date.toLocaleDateString()
}
