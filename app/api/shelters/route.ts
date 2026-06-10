import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: shelters, error } = await supabase
      .from("shelters")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(shelters || [], {
      headers: {
        // Sin caché de CDN: las aprobaciones deben verse al instante.
        "Cache-Control": "no-store, max-age=0",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching shelters:", error)
    return NextResponse.json({ error: "Error al cargar las protectoras" }, { status: 500 })
  }
}
