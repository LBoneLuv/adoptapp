import { NextResponse } from "next/server"
import { getBreedsBySpecies } from "@/lib/breeds-data"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const species = searchParams.get("species")
    const query = searchParams.get("query") || ""

    if (!species) {
      return NextResponse.json({ breeds: [] })
    }

    const breeds = getBreedsBySpecies(species, query)

    return NextResponse.json({ breeds })
  } catch (error) {
    console.error("Error fetching breeds:", error)
    return NextResponse.json({ breeds: [] }, { status: 500 })
  }
}
