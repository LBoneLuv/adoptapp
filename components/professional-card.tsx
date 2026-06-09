import Link from "next/link"
import { MapPin, Star, BadgeCheck } from "lucide-react"
import Image from "next/image"
import { memo } from "react"
import type { Professional } from "@/lib/professionals-config"

interface ProfessionalCardProps {
  professional: Pick<
    Professional,
    | "id"
    | "name"
    | "location"
    | "cover_image_url"
    | "profile_image_url"
    | "rating"
    | "verified"
    | "short_description"
    | "price_range"
  >
}

export const ProfessionalCard = memo(function ProfessionalCard({ professional }: ProfessionalCardProps) {
  return (
    <Link href={`/profesional/${professional.id}`} prefetch={true}>
      <div className="bg-[#FFFBFE] rounded-3xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Cover Image */}
        <div className="relative h-24 bg-gradient-to-br from-[#E8DEF8] to-[#D0BCFF]">
          {professional.cover_image_url ? (
            <Image
              src={professional.cover_image_url || "/placeholder.svg"}
              alt={`${professional.name} cover`}
              fill
              className="object-cover"
              sizes="100vw"
              loading="lazy"
              quality={75}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#E8DEF8] to-[#D0BCFF]" />
          )}

          {/* Price badge */}
          {professional.price_range && (
            <span className="absolute top-2 right-2 bg-white/90 text-[#6750A4] text-xs font-semibold px-2 py-0.5 rounded-full">
              {professional.price_range}
            </span>
          )}

          {/* Profile Image Overlay */}
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2">
            <div className="w-16 h-16 rounded-full bg-[#FFFBFE] p-1 shadow-md">
              <div className="w-full h-full rounded-full overflow-hidden relative bg-[#E8DEF8] flex items-center justify-center">
                {professional.profile_image_url ? (
                  <Image
                    src={professional.profile_image_url || "/placeholder.svg"}
                    alt={professional.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                    loading="lazy"
                    quality={75}
                  />
                ) : (
                  <svg className="w-8 h-8 text-[#6750A4]" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3l-10 9h3v9h6v-6h2v6h6v-9h3l-10-9z" />
                  </svg>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="pt-10 pb-4 px-3">
          <h3 className="text-sm font-semibold text-[#1C1B1F] text-center mb-1 line-clamp-2 leading-tight flex items-center justify-center gap-1">
            {professional.name}
            {professional.verified && <BadgeCheck className="w-4 h-4 text-[#6750A4] flex-shrink-0" />}
          </h3>

          {professional.rating != null && (
            <div className="flex items-center justify-center gap-1 mb-1">
              <Star className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" />
              <span className="text-xs font-medium text-[#1C1B1F]">{professional.rating.toFixed(1)}</span>
            </div>
          )}

          <div className="flex items-center justify-center gap-1 text-[#49454F]">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs line-clamp-1">{professional.location}</span>
          </div>
        </div>
      </div>
    </Link>
  )
})
