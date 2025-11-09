import { MapPin, Cake } from "lucide-react"
import { Card } from "@/components/ui/card"
import Image from "next/image"
import Link from "next/link"
import { memo } from "react"

interface Pet {
  id: string
  name: string
  age: string
  breed: string
  location: string
  images: string[]
}

interface PetCardProps {
  pet: Pet
}

export const PetCard = memo(function PetCard({ pet }: PetCardProps) {
  const imageUrl = pet.images && pet.images.length > 0 ? pet.images[0] : "/placeholder.svg?height=160&width=200"

  return (
    <Link href={`/pet/${pet.id}`} prefetch={true}>
      <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all bg-[#FFFBFE] border-0 shadow-md rounded-3xl px-0 mb-[0]">
        <div className="relative h-40 w-full bg-[#E7E0EC] mt-[-25px]">
          <Image
            src={imageUrl || "/placeholder.svg"}
            alt={pet.name}
            fill
            className="object-cover mx-0 mt-0"
            sizes="(max-width: 768px) 50vw, 33vw"
            loading="lazy"
            quality={75}
          />

          <div className="absolute bottom-2 left-2 bg-white/95 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-md">
            <MapPin className="w-3.5 h-3.5 text-[#6750A4]" />
            <span className="text-xs font-medium text-[#1C1B1F]">{pet.location}</span>
          </div>
        </div>

        <div className="p-4 mb-[-20px] mt-[-20px]">
          <h3 className="font-bold text-[#1C1B1F] mb-2 mt-[-10px] text-sm">{pet.name}</h3>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 text-[#49454F] text-xs">
              <Cake className="w-4 h-4 text-[#6750A4]" />
              <span>{pet.age}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-[#49454F]">
              <svg className="w-4 h-4 text-[#6750A4]" viewBox="0 0 24 24" fill="currentColor">
                <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
                <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
                <ellipse cx="5" cy="10" rx="2" ry="2.5" />
                <ellipse cx="19" cy="10" rx="2" ry="2.5" />
                <path d="M12 22c-3.5 0-5.5-2-5.5-4.5 0-2 1.5-3.5 3-4 .5-.2 1-.3 1.5-.3h2c.5 0 1 .1 1.5.3 1.5.5 3 2 3 4 0 2.5-2 4.5-5.5 4.5z" />
              </svg>
              <span className="text-xs">{pet.breed}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
})
