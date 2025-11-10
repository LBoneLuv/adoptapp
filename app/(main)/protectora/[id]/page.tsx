"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { MapPin, Globe, Facebook, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PetCard } from "@/components/pet-card"

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

export default function ProtectoraDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [shelter, setShelter] = useState<Shelter | null>(null)
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  // Accessing params.id directly in client component
  const shelterId = params.id

  useEffect(() => {
    async function loadShelterData() {
      console.log("[v0] Loading shelter with ID:", shelterId)
      const supabase = createClient()

      const { data: shelterData, error: shelterError } = await supabase
        .from("shelters")
        .select("*")
        .eq("id", shelterId)
        .single()

      console.log("[v0] Shelter query result:", { shelterData, shelterError })

      if (!shelterError && shelterData) {
        setShelter(shelterData)

        // Solo cargar animales si la protectora existe
        const { data: animalsData, error: animalsError } = await supabase
          .from("animals")
          .select("*")
          .eq("shelter_id", shelterId)
          .eq("status", "available")
          .order("created_at", { ascending: false })

        console.log("[v0] Animals query result:", { animalsData, animalsError })

        if (!animalsError && animalsData) {
          setAnimals(animalsData)
        }
      }

      setLoading(false)
    }

    loadShelterData()
  }, [shelterId])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]"></div>
      </div>
    )
  }

  if (!shelter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FEF7FF] px-6">
        <p className="text-[#49454F] text-center mb-4">No se encontró la protectora</p>
        <Button onClick={() => router.back()} className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full">
          Volver
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF] overflow-y-auto">
      {/* Cover Image */}
      <div className="relative h-48">
        <img
          src={shelter.cover_image_url || "/placeholder.svg?height=192&width=400"}
          alt="Portada"
          className="w-full h-full object-cover"
        />
      </div>

      {/* Profile Section */}
      <div className="px-4 -mt-16 mb-4 relative z-10">
        <div className="flex items-end gap-4">
          {/* Profile Image */}
          <img
            src={shelter.profile_image_url || "/placeholder.svg?height=120&width=120"}
            alt={shelter.name}
            className="w-28 h-28 rounded-full border-4 border-[#FFFBFE] shadow-lg object-cover"
          />

          {/* Social Icons horizontal */}
          <div className="flex gap-2 mb-2">
            {shelter.website && (
              <a
                href={shelter.website}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 bg-[#6750A4] rounded-full flex items-center justify-center text-white hover:bg-[#7965AF] transition-colors shadow-md"
                title="Sitio Web"
              >
                <Globe className="w-4 h-4" />
              </a>
            )}
            {Array.isArray(shelter.social_links) &&
              shelter.social_links.length > 0 &&
              shelter.social_links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-[#6750A4] rounded-full flex items-center justify-center text-white hover:bg-[#7965AF] transition-colors shadow-md"
                  title={link.platform}
                >
                  <SocialIcon platform={link.platform} />
                </a>
              ))}
          </div>
        </div>

        {/* Shelter Info */}
        <div className="mt-4">
          <h2 className="font-bold text-[#1C1B1F] text-2xl">{shelter.name}</h2>
          <div className="flex items-center gap-2 text-[#49454F] mt-1">
            <MapPin className="w-4 h-4" />
            <span className="text-sm">{shelter.location}</span>
          </div>
          {shelter.description && <p className="text-[#49454F] text-sm mt-3 leading-relaxed">{shelter.description}</p>}
        </div>
      </div>

      {/* Animals Section */}
      <div className="flex-1 px-4 pb-20">
        <h3 className="font-bold text-[#1C1B1F] text-lg mb-4">Animales en Adopción</h3>
        {animals.length === 0 ? (
          <p className="text-[#49454F] text-center py-8">No hay animales disponibles en este momento</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {animals.map((animal) => (
              <PetCard key={animal.id} pet={animal} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
