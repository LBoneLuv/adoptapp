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
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching shelters:", error)
    return NextResponse.json({ error: "Error al cargar las protectoras" }, { status: 500 })
  }
}
