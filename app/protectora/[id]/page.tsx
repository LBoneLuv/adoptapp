"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Globe, Facebook, Instagram } from "lucide-react"
import { PetCard } from "@/components/pet-card"

type Shelter = {
  id: string
  name: string
  location: string
  description: string
  profile_image_url: string | null
  cover_image_url: string | null
  website: string | null
  social_links: Array<{ platform: string; url: string }> | null
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
  const id = params?.id as string
  const [shelter, setShelter] = useState<Shelter | null>(null)
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const fetchData = async () => {
      const { data: shelterData } = await supabase.from("shelters").select("*").eq("id", id).single()

      if (shelterData) {
        setShelter(shelterData)

        const { data: animalsData } = await supabase
          .from("animals")
          .select("*")
          .eq("shelter_id", id)
          .eq("status", "available")
          .order("created_at", { ascending: false })

        setAnimals(animalsData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!shelter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-lg text-muted-foreground mb-4">No se encontró la protectora</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {shelter.cover_image_url && (
          <img
            src={shelter.cover_image_url || "/placeholder.svg"}
            alt={`${shelter.name} cover`}
            className="w-full h-48 object-cover"
          />
        )}
      </div>

      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {shelter.profile_image_url ? (
              <img
                src={shelter.profile_image_url || "/placeholder.svg"}
                alt={shelter.name}
                className="w-28 h-28 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-background bg-muted flex items-center justify-center">
                <span className="text-4xl">🐾</span>
              </div>
            )}
          </div>

          {(shelter.website || (shelter.social_links && shelter.social_links.length > 0)) && (
            <div className="flex gap-2 mt-20">
              {shelter.website && (
                <a
                  href={shelter.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <Globe className="w-4 h-4 text-primary" />
                </a>
              )}
              {shelter.social_links?.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <div className="text-primary">
                    <SocialIcon platform={link.platform} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">{shelter.name}</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">{shelter.location}</span>
          </div>
        </div>

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Sobre Nosotros</h2>
          <p className="text-muted-foreground">{shelter.description}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Nuestros Animales</h2>
          {animals.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {animals.map((animal) => (
                <PetCard key={animal.id} pet={animal} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay animales disponibles en este momento</p>
          )}
        </div>
      </div>
    </div>
  )
}
