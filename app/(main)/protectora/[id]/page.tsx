import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Facebook, Instagram } from "lucide-react"
import ProtectoraDetailClient from "./protectora-detail-client"

type Shelter = {
  id: string
  name: string
  location: string
  description: string
  profile_image_url: string | null
  cover_image_url: string | null
  website: string | null
  social_links: Array<{ platform: string; url: string }>
}

type Animal = {
  id: string
  name: string
  species: string
  breed: string
  age: string
  gender: string
  image_url: string
  images: string[]
}

const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "facebook":
      return <Facebook className="w-5 h-5" />
    case "instagram":
      return <Instagram className="w-5 h-5" />
    case "tiktok":
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      )
    default:
      return null
  }
}

export default async function ProtectoraDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const { id } = params
  const supabase = await createClient()

  const { data: shelter, error: shelterError } = await supabase.from("shelters").select("*").eq("id", id).single()

  if (shelterError || !shelter) {
    notFound()
  }

  const { data: animals } = await supabase
    .from("animals")
    .select("*")
    .eq("shelter_id", id)
    .eq("status", "available")
    .order("created_at", { ascending: false })

  return <ProtectoraDetailClient shelter={shelter} animals={animals || []} />
}
