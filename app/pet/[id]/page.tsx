"use client"

import { ArrowLeft, MapPin, Calendar, Tag, Check, X, ChevronRight, Ruler, Heart, XIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { AdoptButton } from "@/components/adopt-button"

type Animal = {
  id: string
  name: string
  species: string
  breed: string
  age: string
  gender: string
  image_url: string
  images: string[]
  location: string
  description: string
  vaccinated: boolean
  microchipped: boolean
  sterilized: boolean
  active_level: number | null
  affectionate_level: number | null
  sociable_level: number | null
  size: string | null
  shelter_id: string
  shelters: {
    id: string
    name: string
    location: string
    profile_image_url: string | null
  }
}

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  return <PetDetailPageClient animalId={id} />
}

function PetDetailPageClient({ animalId }: { animalId: string }) {
  const router = useRouter()
  const [animal, setAnimal] = useState<Animal | null>(null)
  const [loading, setLoading] = useState(true)
  const [isFavorite, setIsFavorite] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    loadAnimal()
    checkFavorite()
  }, [animalId])

  async function loadAnimal() {
    const supabase = createClient()
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
      .eq("id", animalId)
      .single()

    if (data) {
      setAnimal(data)
    }
    setLoading(false)
  }

  async function checkFavorite() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    const { data } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .eq("animal_id", animalId)
      .single()

    setIsFavorite(!!data)
  }

  async function toggleFavorite() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("animal_id", animalId)
      setIsFavorite(false)
    } else {
      await supabase.from("favorites").insert({
        user_id: user.id,
        animal_id: animalId,
      })
      setIsFavorite(true)
    }
  }

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
  }

  const nextImage = () => {
    if (animal && animal.images) {
      setCurrentImageIndex((prev) => (prev + 1) % animal.images.length)
    }
  }

  const prevImage = () => {
    if (animal && animal.images) {
      setCurrentImageIndex((prev) => (prev - 1 + animal.images.length) % animal.images.length)
    }
  }

  if (loading || !animal) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]"></div>
      </div>
    )
  }

  const images = animal.images || []
  const firstImage = images.length > 0 ? images[0] : "/placeholder.svg?height=320&width=400"

  const GenderIcon = ({ gender }: { gender: string }) => {
    if (gender === "macho") {
      return (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="10" cy="14" r="6" />
          <path d="M14 8l6-6M20 2v6M20 2h-6" />
        </svg>
      )
    }
    return (
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="6" />
        <path d="M12 14v8M9 19h6" />
      </svg>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-4 bg-[#FFFBFE]/95 backdrop-blur-sm shadow-sm">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1C1B1F]" />
        </button>
        <h1 className="text-lg font-bold text-[#1C1B1F]">Detalles</h1>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="pt-16 pb-24">
        {/* Image Display with Favorite Button */}
        <div className="relative bg-[#FFFBFE]">
          <div className="relative h-80 w-full bg-[#E7E0EC] cursor-pointer" onClick={() => openLightbox(0)}>
            <Image src={firstImage || "/placeholder.svg"} alt={animal.name} fill className="object-cover" />

            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite()
              }}
              className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors z-10"
            >
              <Heart className={`w-6 h-6 ${isFavorite ? "fill-[#BA1A1A] text-[#BA1A1A]" : "text-[#1C1B1F]"}`} />
            </button>
          </div>

          {/* Image indicators if multiple images */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {images.map((_: string, index: number) => (
                <div
                  key={index}
                  className={`h-2 rounded-full cursor-pointer ${index === 0 ? "bg-[#6750A4] w-8" : "bg-[#6750A4]/40 w-2"}`}
                  onClick={() => openLightbox(index)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Pet Info */}
        <div className="px-4 py-6 bg-[#FFFBFE] shadow-sm">
          <h2 className="font-bold text-[#1C1B1F] mb-3 text-xl">{animal.name}</h2>
          <div className="flex flex-wrap gap-4 text-[#49454F]">
            <div className="flex items-center gap-2">
              <Calendar className="text-[#6750A4] size-4" />
              <span className="text-sm">{animal.age}</span>
            </div>
            {animal.breed && (
              <div className="flex items-center gap-2">
                <Tag className="text-[#6750A4] size-4" />
                <span className="text-sm">{animal.breed}</span>
              </div>
            )}
            {animal.gender && (
              <div className="flex items-center gap-2">
                <div className={`${animal.gender === "macho" ? "text-blue-500" : "text-pink-500"}`}>
                  <GenderIcon gender={animal.gender} />
                </div>
                <span className="text-sm">{animal.gender === "macho" ? "Macho" : "Hembra"}</span>
              </div>
            )}
            {animal.size && (
              <div className="flex items-center gap-2">
                <Ruler className="text-[#6750A4] size-4" />
                <span className="text-sm capitalize">{animal.size}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <MapPin className="text-[#6750A4] size-4" />
              <span className="text-sm">{animal.location}</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="px-4 py-6 bg-[#FFFBFE] shadow-sm mt-2">
          <h3 className="font-bold text-[#1C1B1F] mb-3 text-base">Descripción</h3>
          <p className="text-[#49454F] leading-relaxed text-sm">{animal.description}</p>
        </div>

        {(animal.active_level !== null || animal.affectionate_level !== null || animal.sociable_level !== null) && (
          <div className="px-4 py-6 bg-[#FFFBFE] shadow-sm mt-2">
            <h3 className="font-bold text-[#1C1B1F] mb-4 text-base">Personalidad</h3>
            <div className="flex gap-4">
              {animal.active_level !== null && (
                <div className="flex flex-col items-center gap-2 flex-1 p-4 rounded-2xl bg-[#E8DEF8] border-2 border-[#6750A4]">
                  <div className="font-bold text-[#6750A4] text-xl">{animal.active_level}/10</div>
                  <span className="font-medium text-xs text-[#6750A4] text-center">Activo</span>
                </div>
              )}

              {animal.affectionate_level !== null && (
                <div className="flex flex-col items-center gap-2 flex-1 p-4 rounded-2xl bg-[#E8DEF8] border-2 border-[#6750A4]">
                  <div className="font-bold text-[#6750A4] text-xl">{animal.affectionate_level}/10</div>
                  <span className="font-medium text-xs text-[#6750A4] text-center">Cariñoso</span>
                </div>
              )}

              {animal.sociable_level !== null && (
                <div className="flex flex-col items-center gap-2 flex-1 p-4 rounded-2xl bg-[#E8DEF8] border-2 border-[#6750A4]">
                  <div className="font-bold text-[#6750A4] text-xl">{animal.sociable_level}/10</div>
                  <span className="font-medium text-xs text-[#6750A4] text-center">Sociable</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Health Details */}
        <div className="px-4 py-6 bg-[#FFFBFE] shadow-sm mt-2">
          <h3 className="font-bold text-[#1C1B1F] mb-4 text-base">Detalles de Salud</h3>
          <div className="flex gap-4">
            <div
              className={`flex flex-col items-center gap-2 flex-1 p-4 rounded-2xl ${
                animal.vaccinated ? "bg-[#D0F4EA] border-2 border-[#006C4C]" : "bg-[#E7E0EC] border-2 border-[#79747E]"
              }`}
            >
              <div
                className={`rounded-full flex items-center justify-center size-8 ${
                  animal.vaccinated ? "bg-[#006C4C]" : "bg-[#79747E]"
                }`}
              >
                {animal.vaccinated ? <Check className="w-6 h-6 text-white" /> : <X className="w-6 h-6 text-white" />}
              </div>
              <span className={`font-medium text-xs ${animal.vaccinated ? "text-[#006C4C]" : "text-[#49454F]"}`}>
                Vacunado
              </span>
            </div>

            <div
              className={`flex flex-col items-center gap-2 flex-1 p-4 rounded-2xl ${
                animal.microchipped
                  ? "bg-[#D0F4EA] border-2 border-[#006C4C]"
                  : "bg-[#E7E0EC] border-2 border-[#79747E]"
              }`}
            >
              <div
                className={`rounded-full flex items-center justify-center size-8 ${
                  animal.microchipped ? "bg-[#006C4C]" : "bg-[#79747E]"
                }`}
              >
                {animal.microchipped ? <Check className="w-6 h-6 text-white" /> : <X className="w-6 h-6 text-white" />}
              </div>
              <span className={`font-medium text-xs ${animal.microchipped ? "text-[#006C4C]" : "text-[#49454F]"}`}>
                Microchip
              </span>
            </div>

            <div
              className={`flex flex-col items-center gap-2 flex-1 p-4 rounded-2xl ${
                animal.sterilized ? "bg-[#D0F4EA] border-2 border-[#006C4C]" : "bg-[#E7E0EC] border-2 border-[#79747E]"
              }`}
            >
              <div
                className={`rounded-full flex items-center justify-center size-8 ${
                  animal.sterilized ? "bg-[#006C4C]" : "bg-[#79747E]"
                }`}
              >
                {animal.sterilized ? <Check className="w-6 h-6 text-white" /> : <X className="w-6 h-6 text-white" />}
              </div>
              <span className={`font-medium text-xs ${animal.sterilized ? "text-[#006C4C]" : "text-[#49454F]"}`}>
                Esterilizado
              </span>
            </div>
          </div>
        </div>

        {/* Shelter Card */}
        {animal.shelters && (
          <div className="px-4 py-6">
            <Link href={`/protectora/${animal.shelters.id}`}>
              <Card className="p-4 bg-[#FFFBFE] border-0 shadow-md hover:shadow-lg transition-shadow cursor-pointer rounded-3xl">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#E7E0EC] flex-shrink-0">
                    <Image
                      src={animal.shelters.profile_image_url || "/placeholder.svg?height=64&width=64"}
                      alt={animal.shelters.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-[#1C1B1F] mb-1">{animal.shelters.name}</h4>
                    <div className="flex items-center gap-1 text-sm text-[#49454F]">
                      <MapPin className="w-4 h-4 text-[#6750A4]" />
                      <span>{animal.shelters.location}</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#79747E]" />
                </div>
              </Card>
            </Link>
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center">
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <XIcon className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={prevImage}
            className="absolute left-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-8 h-8 text-white rotate-180" />
          </button>

          <div className="relative w-full h-full flex items-center justify-center p-4">
            <img
              src={images[currentImageIndex] || "/placeholder.svg"}
              alt={`${animal.name} - Imagen ${currentImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          <button
            onClick={nextImage}
            className="absolute right-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>

          <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
            {images.map((_: string, index: number) => (
              <div
                key={index}
                className={`h-2 rounded-full transition-all ${
                  index === currentImageIndex ? "bg-white w-8" : "bg-white/40 w-2"
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFFBFE] px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <AdoptButton animalId={animal.id} animalName={animal.name} shelterId={animal.shelter_id} />
      </div>
    </div>
  )
}
