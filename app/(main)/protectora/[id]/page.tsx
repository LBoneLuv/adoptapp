"use client"

import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, MapPin, Globe, Facebook, Instagram } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

export default function ProtectoraDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [shelter, setShelter] = useState<Shelter | null>(null)
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadShelterData() {
      const supabase = createClient()
      const shelterId = params.id as string

      const { data: shelterData } = await supabase.from("shelters").select("*").eq("id", shelterId).single()

      console.log("[v0] Shelter data completa:", JSON.stringify(shelterData, null, 2))
      console.log("[v0] Website existe?:", !!shelterData?.website)
      console.log("[v0] Website valor:", shelterData?.website)
      console.log("[v0] Social links existe?:", !!shelterData?.social_links)
      console.log("[v0] Social links valor:", JSON.stringify(shelterData?.social_links, null, 2))
      console.log("[v0] Social links es array?:", Array.isArray(shelterData?.social_links))
      console.log("[v0] Social links length:", shelterData?.social_links?.length)

      const { data: animalsData } = await supabase
        .from("animals")
        .select("*")
        .eq("shelter_id", shelterId)
        .eq("status", "available")
        .order("created_at", { ascending: false })

      if (shelterData) {
        setShelter(shelterData)
      }
      if (animalsData) {
        setAnimals(animalsData)
      }
      setLoading(false)
    }

    loadShelterData()
  }, [params.id])

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
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      {/* Header with back button */}
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm flex items-center">
        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-[#1C1B1F]" />
        </button>
        <h1 className="flex-1 text-center font-bold text-[#1C1B1F] text-base pr-10">Protectora</h1>
      </header>

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

          <div className="flex flex-col gap-2 mb-2">
            {shelter.website && (
              <>
                {console.log("[v0] Renderizando icono de website")}
                <a
                  href={shelter.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 bg-[#6750A4] rounded-full flex items-center justify-center text-white hover:bg-[#7965AF] transition-colors shadow-md"
                  title="Sitio Web"
                >
                  <Globe className="w-4 h-4" />
                </a>
              </>
            )}
            {Array.isArray(shelter.social_links) && shelter.social_links.length > 0 && (
              <>
                {console.log("[v0] Renderizando", shelter.social_links.length, "iconos de redes sociales")}
                {shelter.social_links.map((link, index) => (
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
              </>
            )}
            {!shelter.website &&
              (!Array.isArray(shelter.social_links) || shelter.social_links.length === 0) &&
              console.log("[v0] No hay iconos para mostrar")}
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
              <Link key={animal.id} href={`/adopta/${animal.id}`}>
                <div className="bg-[#FFFBFE] rounded-3xl overflow-hidden shadow-md hover:shadow-lg transition-shadow">
                  <img
                    src={animal.image_url || animal.images?.[0] || "/placeholder.svg?height=200&width=200"}
                    alt={animal.name}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-3">
                    <h4 className="font-semibold text-[#1C1B1F] text-sm">{animal.name}</h4>
                    <p className="text-[#49454F] text-xs mt-1">
                      {animal.breed} • {animal.age}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
