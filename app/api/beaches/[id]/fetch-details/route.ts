import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { normalizeBeachImage, normalizeBeachPhotos } from "@/lib/beach-image"

// Quita acentos y pasa a minúsculas (para comparar textos de cabecera).
function deaccent(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
}

// Convierte un fragmento HTML en texto legible (conserva saltos de línea).
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|h[1-6]|div)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&aacute;/gi, "á")
    .replace(/&eacute;/gi, "é")
    .replace(/&iacute;/gi, "í")
    .replace(/&oacute;/gi, "ó")
    .replace(/&uacute;/gi, "ú")
    .replace(/&ntilde;/gi, "ñ")
    .replace(/&#8230;/g, "…")
    .replace(/&[a-z#0-9]+;/gi, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

interface Heading {
  text: string
  start: number
  end: number
}

function getHeadings(html: string): Heading[] {
  const out: Heading[] = []
  const re = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const text = deaccent(m[2].replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " "))
      .replace(/\s+/g, " ")
      .trim()
    out.push({ text, start: m.index, end: m.index + m[0].length })
  }
  return out
}

// Devuelve el HTML que hay entre una cabecera cuyo texto contiene alguna de las
// palabras clave y la siguiente cabecera.
function sectionHtml(html: string, headings: Heading[], keywords: string[]): string | null {
  for (let i = 0; i < headings.length; i++) {
    if (keywords.some((k) => headings[i].text.includes(k))) {
      const start = headings[i].end
      const end = i + 1 < headings.length ? headings[i + 1].start : html.length
      return html.slice(start, end)
    }
  }
  return null
}

async function scrapeBeachDetails(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
        "Accept-Language": "es-ES,es;q=0.9",
      },
    })
    const html = await response.text()
    const headings = getHeadings(html)

    // Descripción: primeros párrafos que hablan de la playa.
    const paras: string[] = []
    for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
      const t = htmlToText(m[1])
      if (t.length > 40 && /playa|perro|arena|ba[ñn]o|costa|cala|litoral/i.test(t)) {
        paras.push(t)
        if (paras.length >= 4) break
      }
    }
    const description = paras.length ? paras.join("\n\n") : null

    // Cómo llegar: la sección bajo la cabecera; si va vacía (p.ej. solo el mapa),
    // se busca un párrafo con indicaciones de acceso.
    const howToSection = sectionHtml(html, headings, ["como llegar"])
    let howToGet = howToSection ? htmlToText(howToSection).slice(0, 900) : ""
    if (!howToGet || howToGet.length < 25) {
      for (const m of html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)) {
        const t = htmlToText(m[1])
        if (
          t.length > 40 &&
          /(c[oó]mo llegar|en coche|carretera|acceso|aparca|gps|coordenadas|autov[ií]a|salida \d|se encuentra)/i.test(t)
        ) {
          howToGet = t
          break
        }
      }
    }
    const howToGetFinal = howToGet || null

    // Normas (como lista si las hay)
    const rulesSection = sectionHtml(html, headings, ["normas", "reglas"])
    let rules: string | null = null
    if (rulesSection) {
      const items = [...rulesSection.matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
        .map((x) => htmlToText(x[1]))
        .filter((t) => t.length > 1)
      rules = items.length ? items.map((i) => "• " + i).join("\n") : htmlToText(rulesSection).slice(0, 900) || null
    }

    // Servicios / instalaciones
    const servicesSection = sectionHtml(html, headings, ["servicios", "instalaciones", "equipamiento"])
    const services = servicesSection ? htmlToText(servicesSection).slice(0, 700) || null : null

    // Fotos: de la sección de fotos; si no, imágenes de contenido antes de "Alojamientos".
    const isPhoto = (u: string) =>
      u.includes("wp-content/uploads") &&
      !/-\d+x\d+\./.test(u) &&
      !/cropped-logo|logo-playas-perros|gravatar|wpgmza|\/emoji\/|\/avatar/i.test(u)
    const photosUrls: string[] = []
    const photosSection = sectionHtml(html, headings, ["fotos", "videos", "galeria", "imagenes"])
    const scope = photosSection || html.split(/Alojamientos|Hoteles y Apartamentos/i)[0]
    for (const m of scope.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)) {
      const u = m[1]
      if (isPhoto(u) && !photosUrls.includes(u)) {
        photosUrls.push(u)
        if (photosUrls.length >= 8) break
      }
    }

    return {
      description,
      howToGet: howToGetFinal,
      rules,
      services,
      photosUrls: normalizeBeachPhotos(photosUrls),
    }
  } catch (error) {
    console.error("Error scraping beach details:", error)
    return null
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: beachId } = await params
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: async () => cookieStore.getAll(),
          setAll: async (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const { data: beach, error: fetchError } = await supabase
      .from("dog_beaches")
      .select("more_info_url, details_fetched")
      .eq("id", beachId)
      .single()

    if (fetchError || !beach) {
      return NextResponse.json({ error: "Playa no encontrada" }, { status: 404 })
    }

    const force = request.nextUrl.searchParams.get("force") === "1"
    if (beach.details_fetched && !force) {
      return NextResponse.json({ message: "Detalles ya obtenidos anteriormente" })
    }

    if (!beach.more_info_url) {
      return NextResponse.json({ error: "No hay URL de información" }, { status: 400 })
    }

    const details = await scrapeBeachDetails(beach.more_info_url)

    if (!details) {
      return NextResponse.json({ error: "Error al obtener detalles" }, { status: 500 })
    }

    // No sobrescribir texto existente con null (solo mejorar/añadir); las fotos
    // sí se refrescan siempre (para quitar el banner del logo).
    const update: Record<string, unknown> = {
      photos_urls: details.photosUrls,
      details_fetched: true,
    }
    if (details.description) update.description = details.description
    if (details.howToGet) update.how_to_get = details.howToGet
    if (details.rules) update.rules = details.rules
    if (details.services) update.services = details.services

    const { error: updateError } = await supabase.from("dog_beaches").update(update).eq("id", beachId)

    if (updateError) {
      console.error("Error updating beach:", updateError)
      return NextResponse.json({ error: "Error al guardar detalles" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      details: {
        description: details.description,
        how_to_get: details.howToGet,
        rules: details.rules,
        services: details.services,
        photos_urls: details.photosUrls,
      },
    })
  } catch (error) {
    console.error("Error in fetch-details:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
