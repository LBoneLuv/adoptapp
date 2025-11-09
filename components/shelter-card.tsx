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
  }
}

export const ShelterCard = memo(function ShelterCard({ shelter }: ShelterCardProps) {
  return (
    <Link href={`/protectora/${shelter.id}`} prefetch={true}>
      <div className="bg-[#FFFBFE] rounded-3xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Cover Image */}
        <div className="relative h-24 bg-gradient-to-br from-[#E8DEF8] to-[#D0BCFF]">
          {shelter.cover_image_url ? (
            <Image
              src={shelter.cover_image_url || "/placeholder.svg"}
              alt={`${shelter.name} cover`}
              fill
              className="object-cover"
              sizes="100vw"
              loading="lazy"
              quality={75}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E8DEF8] to-[#D0BCFF]" />
          )}

          {/* Profile Image Overlay */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-16 h-16 rounded-full bg-[#FFFBFE] p-1 shadow-md">
              <div className="w-full h-full rounded-full overflow-hidden relative bg-[#E8DEF8] flex items-center justify-center">
                {shelter.profile_image_url ? (
                  <Image
                    src={shelter.profile_image_url || "/placeholder.svg"}
                    alt={shelter.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                    loading="lazy"
                    quality={75}
                  />
                ) : (
                  <svg
                    className="w-8 h-8 text-[#6750A4]"
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
        </div>

        {/* Content */}
        <div className="pt-10 pb-4 px-3">
          <h3 className="text-sm font-semibold text-[#1C1B1F] text-center mb-2 line-clamp-2 leading-tight">
            {shelter.name}
          </h3>
          <div className="flex items-center justify-center gap-1 text-[#49454F]">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs">{shelter.location}</span>
          </div>
        </div>
      </div>
    </Link>
  )
})
