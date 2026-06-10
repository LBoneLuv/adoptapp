import Link from "next/link"
import { MapPin } from "lucide-react"
import Image from "next/image"
import { memo } from "react"

interface ShelterCardProps {
  shelter: {
    id: string
    name: string
    location: string
    cover_image_url: string | null
    profile_image_url: string | null
    description?: string | null
  }
}

export const ShelterCard = memo(function ShelterCard({ shelter }: ShelterCardProps) {
  return (
    <Link href={`/protectora/${shelter.id}`} prefetch={true}>
      <div className="bg-[#FFFBFE] rounded-3xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex gap-3 p-3">
        {/* Logo a la izquierda */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden relative bg-gradient-to-br from-[#E8DEF8] to-[#D0BCFF] flex-shrink-0 flex items-center justify-center">
          {shelter.profile_image_url ? (
            <Image
              src={shelter.profile_image_url || "/placeholder.svg"}
              alt={shelter.name}
              fill
              className="object-cover"
              sizes="96px"
              loading="lazy"
              quality={75}
            />
          ) : (
            <svg className="w-10 h-10 text-[#6750A4]/70" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3l-10 9h3v9h6v-6h2v6h6v-9h3l-10-9z" />
            </svg>
          )}
        </div>

        {/* Información a la derecha */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <h3 className="text-base font-semibold text-[#1C1B1F] line-clamp-1">{shelter.name}</h3>
          <div className="flex items-center gap-1 text-xs text-[#49454F] mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{shelter.location}</span>
          </div>
          {shelter.description && (
            <p className="text-xs text-[#79747E] mt-1 line-clamp-2">{shelter.description}</p>
          )}
        </div>
      </div>
    </Link>
  )
})
