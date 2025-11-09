import { getAnimal, getCurrentShelter } from "@/lib/supabase/queries"
import { redirect } from "next/navigation"
import EditAnimalForm from "./edit-animal-form"

export default async function EditarAnimalPage({ params }: { params: { id: string } }) {
  const shelter = await getCurrentShelter()

  if (!shelter) {
    redirect("/login")
  }

  const animal = await getAnimal(params.id)

  if (!animal || animal.shelter_id !== shelter.id) {
    redirect("/admin/animales")
  }

  return <EditAnimalForm animal={animal} />
}
