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

// Imágenes "basura" que no son fotos de la playa: el logo/banner del sitio
// (cropped-logo-playas-perros…) que el scraper recoge en casi todas las playas.
const JUNK_PATTERNS = [/cropped-logo/i, /logo-playas-perros/i, /placeholder/i]

export function isJunkBeachImage(url: string | null | undefined): boolean {
  if (!url) return true
  return JUNK_PATTERNS.some((p) => p.test(url))
}

export function normalizeBeachPhotos(urls: string[] | null | undefined): string[] {
  if (!urls) return []
  return urls
    .map((u) => normalizeBeachImage(u))
    .filter((u): u is string => !!u && !isJunkBeachImage(u))
}

// Candidatas para la imagen de cabecera, en orden de preferencia:
// la image_url y luego las fotos de la galería (sin basura ni duplicados).
// Así, si la image_url está rota (p.ej. googleusercontent caducado), se usa
// la primera foto válida de la galería.
export function beachHeaderSources(
  imageUrl: string | null | undefined,
  photos: string[] | null | undefined,
): string[] {
  const out: string[] = []
  const seen = new Set<string>()
  for (const c of [imageUrl, ...(photos || [])]) {
    const n = normalizeBeachImage(c)
    if (n && !isJunkBeachImage(n) && !seen.has(n)) {
      seen.add(n)
      out.push(n)
    }
  }
  return out
}
