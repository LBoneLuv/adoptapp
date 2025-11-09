import { NextResponse } from "next/server"
import { getCurrentShelter, getShelterAnimals } from "@/lib/supabase/queries"

export async function GET() {
  try {
    const shelter = await getCurrentShelter()

    if (!shelter) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const animals = await getShelterAnimals(shelter.id)

    return NextResponse.json(animals)
  } catch (error) {
    console.error("Error fetching shelter animals:", error)
    return NextResponse.json({ error: "Error al cargar los animales" }, { status: 500 })
  }
}
