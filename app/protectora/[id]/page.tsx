import { ArrowLeft, MapPin, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PetCard } from "@/components/pet-card"
import Image from "next/image"
import Link from "next/link"
import { getShelterById } from "@/lib/supabase/queries"
import { notFound } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function ProtectoraDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  let shelter
  try {
    shelter = await getShelterById(id)
  } catch (error) {
    notFound()
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      {/* Header with Back Button */}
      <header className="fixed top-0 left-0 right-0 z-10 flex items-center px-4 py-4 bg-transparent">
        <Link href="/protectoras">
          <button className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
            <ArrowLeft className="w-5 h-5 text-[#1C1B1F]" />
          </button>
        </Link>
      </header>

      {/* Cover Image */}
      <div className="relative h-40 w-full bg-gradient-to-br from-[#E8DEF8] to-[#D0BCFF]">
        {shelter.cover_image_url ? (
          <Image
            src={shelter.cover_image_url || "/placeholder.svg"}
            alt={`${shelter.name} cover`}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#E8DEF8] to-[#D0BCFF]" />
        )}
        <div className="absolute bottom-4 right-4">
          <Button
            variant="default"
            className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 px-6 text-base font-semibold shadow-lg"
          >
            <Heart className="w-5 h-5 mr-2" />
            Donar
          </Button>
        </div>
      </div>

      {/* Profile Image */}
      <div className="relative -mt-12 flex px-4 items-center justify-start">
        <div className="w-24 h-24 rounded-full bg-[#FFFBFE] p-2 shadow-lg">
          <div className="w-full h-full rounded-full overflow-hidden relative bg-[#E8DEF8] flex items-center justify-center">
            {shelter.profile_image_url ? (
              <Image
                src={shelter.profile_image_url || "/placeholder.svg"}
                alt={shelter.name}
                fill
                className="object-cover"
              />
            ) : (
              <svg
                className="w-12 h-12 text-[#6750A4]"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 3l-10 9h3v9h6v-6h2v6h6v-9h3l-10-9z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Shelter Info */}
      <div className="px-6 mt-4">
        <h1 className="font-bold text-[#1C1B1F] mb-2 text-lg text-left">{shelter.name}</h1>
        <div className="flex gap-2 text-[#49454F] mb-4 text-left items-center justify-start">
          <MapPin className="w-4 h-4" />
          <span className="text-sm">{shelter.location}</span>
        </div>

        {/* Description */}
        {shelter.description && (
          <div className="mb-8">
            <h2 className="font-bold text-[#1C1B1F] mb-3 text-base">Sobre Nosotros</h2>
            <p className="text-[#49454F] text-sm leading-relaxed">{shelter.description}</p>
          </div>
        )}

        {/* Animals Section */}
        <div className="mb-6">
          <h2 className="font-bold text-[#1C1B1F] mb-4 text-base">Nuestros Animales</h2>
          {shelter.animals && shelter.animals.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {shelter.animals.map((animal: any) => (
                <PetCard
                  key={animal.id}
                  pet={{
                    id: animal.id,
                    name: animal.name,
                    age: animal.age,
                    breed: animal.breed || animal.species,
                    location: animal.location,
                    images: animal.images || [],
                    gender: animal.gender,
                  }}
                />
              ))}
            </div>
          ) : (
            <p className="text-[#79747E] text-sm text-center py-8">
              Esta protectora aún no ha publicado animales en adopción.
            </p>
          )}
        </div>
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />
    </div>
  )
}
