import { ArrowLeft, MapPin, Calendar, Tag, Check, X, ChevronRight, Ruler } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { AdoptButton } from "@/components/adopt-button"

export const dynamic = "force-dynamic"

export default async function PetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: animal, error } = await supabase
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
    .eq("id", id)
    .single()

  if (error || !animal) {
    notFound()
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
        <Link
          href="/adopta"
          className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1C1B1F]" />
        </Link>
        <h1 className="text-lg font-bold text-[#1C1B1F]">Detalles</h1>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="pt-16 pb-24">
        {/* Image Display */}
        <div className="relative bg-[#FFFBFE]">
          <div className="relative h-80 w-full bg-[#E7E0EC]">
            <Image src={firstImage || "/placeholder.svg"} alt={animal.name} fill className="object-cover" />
          </div>

          {/* Image indicators if multiple images */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {images.map((_: string, index: number) => (
                <div
                  key={index}
                  className={`h-2 rounded-full ${index === 0 ? "bg-[#6750A4] w-8" : "bg-[#6750A4]/40 w-2"}`}
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

        {(animal.active_level !== null || animal.affectionate_level !== null || animal.sociable_level !== null) && (
          <div className="px-4 py-6 bg-[#FFFBFE] shadow-sm mt-2">
            <h3 className="font-bold text-[#1C1B1F] mb-4 text-base">Personalidad</h3>
            <div className="space-y-4">
              {animal.active_level !== null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#49454F]">Activo</span>
                    <span className="text-xs text-[#6750A4] font-semibold">{animal.active_level}/10</span>
                  </div>
                  <div className="w-full h-2 bg-[#E7E0EC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#6750A4] to-[#7965AF] rounded-full transition-all"
                      style={{ width: `${(animal.active_level / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {animal.affectionate_level !== null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#49454F]">Cariñoso</span>
                    <span className="text-xs text-[#6750A4] font-semibold">{animal.affectionate_level}/10</span>
                  </div>
                  <div className="w-full h-2 bg-[#E7E0EC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#6750A4] to-[#7965AF] rounded-full transition-all"
                      style={{ width: `${(animal.affectionate_level / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {animal.sociable_level !== null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-[#49454F]">Sociable</span>
                    <span className="text-xs text-[#6750A4] font-semibold">{animal.sociable_level}/10</span>
                  </div>
                  <div className="w-full h-2 bg-[#E7E0EC] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#6750A4] to-[#7965AF] rounded-full transition-all"
                      style={{ width: `${(animal.sociable_level / 10) * 100}%` }}
                    />
                  </div>
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

        {/* Description */}
        <div className="px-4 py-6 bg-[#FFFBFE] shadow-sm mt-2">
          <h3 className="font-bold text-[#1C1B1F] mb-3 text-base">Descripción</h3>
          <p className="text-[#49454F] leading-relaxed text-sm">{animal.description}</p>
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

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#FFFBFE] px-4 py-4 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <AdoptButton animalId={animal.id} animalName={animal.name} shelterId={animal.shelter_id} />
      </div>
    </div>
  )
}
