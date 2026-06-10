// Productos vistos recientemente — se guardan por dispositivo en localStorage.
const KEY = "arko_recently_viewed"
const MAX = 12

export function addRecentlyViewed(id: string) {
  if (typeof window === "undefined" || !id) return
  try {
    const list = getRecentlyViewed().filter((x) => x !== id)
    list.unshift(id)
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, MAX)))
  } catch {
    /* almacenamiento no disponible */
  }
}

export function getRecentlyViewed(): string[] {
  if (typeof window === "undefined") return []
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]")
    return Array.isArray(v) ? v : []
  } catch {
    return []
  }
}
