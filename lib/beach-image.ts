// Normaliza las URLs de imágenes de las playas.
// Problema real: muchas imágenes vienen de http://www.redcanina.es/... y al
// servir la app por HTTPS el navegador las bloquea (mixed content) → no se ve
// la foto de cabecera. Aquí forzamos https y quitamos el sufijo de miniatura.
export function normalizeBeachImage(url: string | null | undefined): string | null {
  if (!url) return null
  let out = url.trim()
  // Mixed content: subir http -> https
  if (out.startsWith("http://")) out = "https://" + out.slice("http://".length)
  // Protocol-relative
  if (out.startsWith("//")) out = "https:" + out
  // Quitar miniatura de WordPress (-150x150) para usar el original
  out = out.replace(/-150x150(?=\.\w+$)/i, "")
  return out
}

export function normalizeBeachPhotos(urls: string[] | null | undefined): string[] {
  if (!urls) return []
  return urls.map((u) => normalizeBeachImage(u)).filter((u): u is string => !!u)
}
