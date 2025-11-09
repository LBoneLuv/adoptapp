import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()

    const { data: animals, error } = await supabase
      .from("animals")
      .select("*")
      .eq("status", "available")
      .order("created_at", { ascending: false })

    if (error) throw error

    return NextResponse.json(animals || [], {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching animals:", error)
    return NextResponse.json({ error: "Error al cargar los animales" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()

    const { data, error } = await supabase
      .from("animals")
      .insert([
        {
          ...body,
          shelter_id: user.id,
          status: "available",
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error creating animal:", error)
    return NextResponse.json({ error: "Error al crear el animal" }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    const { data, error } = await supabase.from("animals").update(updateData).eq("id", id).select().single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Error updating animal:", error)
    return NextResponse.json({ error: "Error al actualizar el animal" }, { status: 500 })
  }
}
