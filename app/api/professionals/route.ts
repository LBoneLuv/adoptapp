import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

// GET /api/professionals?type=veterinario
// Devuelve los profesionales aprobados, opcionalmente filtrados por tipo.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const type = request.nextUrl.searchParams.get("type")

    let query = supabase
      .from("professionals")
      .select("*")
      .eq("status", "approved")
      .order("featured", { ascending: false })
      .order("rating", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })

    if (type) {
      query = query.eq("type", type)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json(data || [], {
      headers: {
        // Sin caché de CDN: las aprobaciones deben verse al instante.
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching professionals:", error)
    return NextResponse.json({ error: "Error al cargar los profesionales" }, { status: 500 })
  }
}
