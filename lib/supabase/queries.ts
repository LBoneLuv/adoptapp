import { createClient } from "@/lib/supabase/server"

export async function getCurrentUser() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: user.email,
        display_name: user.email?.split("@")[0] || "Usuario",
        role: "user",
      })
      .select()
      .single()

    return { ...user, profile: newProfile }
  }

  return { ...user, profile }
}

export async function getAnimals() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("animals")
    .select(`
      *,
      shelters (
        id,
        name,
        location,
        profile_image_url
      )
    `)
    .eq("status", "available")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getShelters() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("shelters").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getPosts() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      profiles (
        id,
        display_name,
        avatar_url
      )
    `)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getIncidents() {
  const supabase = await createClient()
  const { data, error } = await supabase.from("incidents").select("*").order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function getCurrentShelter() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: shelter } = await supabase.from("shelters").select("*").eq("id", user.id).single()

  return shelter
}

export async function getShelterAnimals(shelterId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("animals")
    .select("*")
    .eq("shelter_id", shelterId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}

export async function deleteAnimal(animalId: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("animals").delete().eq("id", animalId)

  if (error) throw error
}

// The API route handles creation/updates directly now

export async function getAnimalById(animalId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("animals")
    .select(`
      *,
      shelters (
        id,
        name,
        location,
        phone,
        email,
        profile_image_url
      )
    `)
    .eq("id", animalId)
    .single()

  if (error) throw error
  return data
}

export async function updateShelterStatus(shelterId: string, status: "pending" | "approved" | "rejected") {
  const supabase = await createClient()
  const { data, error } = await supabase.from("shelters").update({ status }).eq("id", shelterId).select().single()

  if (error) throw error
  return data
}

export async function getAnimal(animalId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase.from("animals").select("*").eq("id", animalId).single()

  if (error) throw error
  return data
}

export async function getShelterById(shelterId: string) {
  const supabase = await createClient()
  const { data: shelter, error: shelterError } = await supabase
    .from("shelters")
    .select("*")
    .eq("id", shelterId)
    .single()

  if (shelterError) throw shelterError

  const { data: animals, error: animalsError } = await supabase
    .from("animals")
    .select("*")
    .eq("shelter_id", shelterId)
    .eq("status", "available")
    .order("created_at", { ascending: false })

  if (animalsError) throw animalsError

  return { ...shelter, animals }
}
