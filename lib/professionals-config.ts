// Configuración compartida para los directorios de profesionales.
// Cada "type" de la tabla `professionals` se mapea aquí con sus etiquetas,
// icono, imagen de cabecera y la ruta del directorio en /servicios.

export type ProfessionalType = "veterinario" | "adiestrador" | "paseador" | "residencia"

export interface ProfessionalTypeConfig {
  type: ProfessionalType
  /** segmento de URL del directorio, p.ej. "veterinarios" -> /servicios/veterinarios */
  slug: string
  /** singular, p.ej. "Veterinario" */
  label: string
  /** plural para títulos, p.ej. "Veterinarios" */
  labelPlural: string
  /** texto del estado vacío */
  emptyLabel: string
  /** imagen de cabecera (reutiliza las de /public/images) */
  image: string
  /** nombre del icono de lucide-react usado en la tarjeta de servicios */
  icon: "Stethoscope" | "GraduationCap" | "Dog" | "HomeIcon"
}

export const PROFESSIONAL_TYPES: Record<ProfessionalType, ProfessionalTypeConfig> = {
  veterinario: {
    type: "veterinario",
    slug: "veterinarios",
    label: "Veterinario",
    labelPlural: "Veterinarios",
    emptyLabel: "veterinarios",
    image: "/images/veterinarios.jpg",
    icon: "Stethoscope",
  },
  adiestrador: {
    type: "adiestrador",
    slug: "adiestradores",
    label: "Adiestrador",
    labelPlural: "Adiestradores",
    emptyLabel: "adiestradores",
    image: "/images/adiestradores.jpg",
    icon: "GraduationCap",
  },
  paseador: {
    type: "paseador",
    slug: "paseadores",
    label: "Paseador",
    labelPlural: "Paseadores",
    emptyLabel: "paseadores",
    image: "/images/paseadores.jpg",
    icon: "Dog",
  },
  residencia: {
    type: "residencia",
    slug: "residencias",
    label: "Residencia",
    labelPlural: "Residencias",
    emptyLabel: "residencias",
    image: "/images/residencias.jpg",
    icon: "HomeIcon",
  },
}

/** Mapa slug -> config, para resolver desde la URL (/servicios/[slug]). */
export const PROFESSIONAL_TYPE_BY_SLUG: Record<string, ProfessionalTypeConfig> = Object.values(
  PROFESSIONAL_TYPES,
).reduce(
  (acc, cfg) => {
    acc[cfg.slug] = cfg
    return acc
  },
  {} as Record<string, ProfessionalTypeConfig>,
)

export type SocialLink = { platform: string; url: string }
export type ProfessionalService = { name: string; description?: string; price?: string }
export type ScheduleDay = { day: string; open: string | null; close: string | null }

export interface Professional {
  id: string
  type: ProfessionalType
  name: string
  email: string | null
  phone: string | null
  whatsapp: string | null
  location: string
  address: string | null
  latitude: number | null
  longitude: number | null
  short_description: string | null
  description: string | null
  profile_image_url: string | null
  cover_image_url: string | null
  gallery_images: string[] | null
  website: string | null
  social_links: SocialLink[] | null
  services: ProfessionalService[] | null
  schedule: ScheduleDay[] | null
  price_range: string | null
  rating: number | null
  reviews_count: number | null
  verified: boolean
  featured: boolean
  emergency_24h: boolean
  status: string
}
