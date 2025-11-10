import { getAnimal, getCurrentShelter } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import EditAnimalForm from "./edit-animal-form"

export const dynamic = "force-dynamic"

export default async function EditarAnimalPage({ params }: { params: Promise<{ id: string }> }) {
  const shelter = await getCurrentShelter()

  if (!shelter) {
    redirect("/login")
  }

  const { id } = await params
  const animal = await getAnimal(id)

  if (!animal || animal.shelter_id !== shelter.id) {
    redirect("/admin/animales")
  }

  return <EditAnimalForm animal={animal} />
}
