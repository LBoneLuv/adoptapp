import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function scrapeBeachDetails(url: string) {
  try {
    const response = await fetch(url)
    const html = await response.text()

    const descriptionMatch = html.match(/<p[^>]*>((?:(?!<\/p>).)*?(?:playa|perro|arena|kilómetro|metro)[^<]*?)<\/p>/is)
    let fullDescription = null

    if (descriptionMatch) {
      fullDescription = descriptionMatch[1]
        .replace(/<[^>]+>/g, "")
        .replace(/&nbsp;/g, " ")
        .replace(/\s+/g, " ")
        .trim()
    }

    const howToGetMatch = html.match(/Cómo llegar[^<]*<\/h3>(.*?)(?=<h[23]|$)/is)
    const howToGet = howToGetMatch
      ? howToGetMatch[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim()
          .substring(0, 500)
      : null

    const rulesMatch = html.match(/Normas[^<]*<\/h3>(.*?)(?=<h[23]|$)/is)
    let rules = null
    if (rulesMatch) {
      const rulesHtml = rulesMatch[1]
      const listItems = rulesHtml.match(/<li[^>]*>(.*?)<\/li>/gi) || []
      rules = listItems
        .map((item) => "• " + item.replace(/<[^>]*>/g, "").trim())
        .join("\n")
        .trim()
      if (!rules) {
        rules = rulesHtml
          .replace(/<[^>]*>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim()
      }
    }

    const servicesMatch = html.match(/Servicios[^<]*<\/h3>(.*?)(?=<h[23]|$)/is)
    const services = servicesMatch
      ? servicesMatch[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .trim()
      : null

    const photosSectionMatch = html.match(/(?:Fotos|Vídeos)[^<]*<\/h3>(.*?)(?=Alojamientos|$)/is)
    const photosUrls: string[] = []

    if (photosSectionMatch) {
      const imgMatches = photosSectionMatch[1].matchAll(/<img[^>]+src=["']([^"']+)["']/g)
      for (const match of imgMatches) {
        const url = match[1]
        if (
          url.includes("wp-content/uploads") &&
          !url.includes("-150x150") &&
          !url.includes("-300x") &&
          !url.includes("cdn.playasparaperros.com/fotos/playasparaperros-")
        ) {
          photosUrls.push(url)
        }
      }
    }

    // Si no hay fotos en la sección de Fotos, buscar antes de Alojamientos
    if (photosUrls.length === 0) {
      const beforeAccommodations = html.split(/Alojamientos/i)[0]
      const imgMatches = beforeAccommodations.matchAll(/<img[^>]+src=["']([^"']+)["']/g)
      for (const match of imgMatches) {
        const url = match[1]
        if (
          url.includes("wp-content/uploads") &&
          !url.includes("-150x150") &&
          !url.includes("-300x") &&
          !url.includes("cdn.playasparaperros.com")
        ) {
          photosUrls.push(url)
          if (photosUrls.length >= 5) break
        }
      }
    }

    return {
      description: fullDescription,
      howToGet,
      rules,
      services,
      photosUrls: photosUrls.slice(0, 10),
    }
  } catch (error) {
    console.error("Error scraping beach details:", error)
    return null
  }
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
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

    const beachId = params.id

    const { data: beach, error: fetchError } = await supabase
      .from("dog_beaches")
      .select("more_info_url, details_fetched")
      .eq("id", beachId)
      .single()

    if (fetchError || !beach) {
      return NextResponse.json({ error: "Playa no encontrada" }, { status: 404 })
    }

    if (beach.details_fetched) {
      return NextResponse.json({ message: "Detalles ya obtenidos anteriormente" })
    }

    if (!beach.more_info_url) {
      return NextResponse.json({ error: "No hay URL de información" }, { status: 400 })
    }

    const details = await scrapeBeachDetails(beach.more_info_url)

    if (!details) {
      return NextResponse.json({ error: "Error al obtener detalles" }, { status: 500 })
    }

    const { error: updateError } = await supabase
      .from("dog_beaches")
      .update({
        description: details.description,
        how_to_get: details.howToGet,
        rules: details.rules,
        services: details.services,
        photos_urls: details.photosUrls,
        details_fetched: true,
      })
      .eq("id", beachId)

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
