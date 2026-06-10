import Link from "next/link"
import { MapPin, Star, BadgeCheck, Tag, Clock } from "lucide-react"
import Image from "next/image"
import { memo } from "react"
import { PROFESSIONAL_TYPES, type Professional } from "@/lib/professionals-config"

interface ProfessionalCardProps {
  professional: Pick<
    Professional,
    | "id"
    | "type"
    | "name"
    | "location"
    | "profile_image_url"
    | "rating"
    | "reviews_count"
    | "verified"
    | "short_description"
    | "price_range"
    | "emergency_24h"
  >
}

export const ProfessionalCard = memo(function ProfessionalCard({ professional }: ProfessionalCardProps) {
  const typeLabel = PROFESSIONAL_TYPES[professional.type]?.label
  return (
    <Link href={`/profesional/${professional.id}`} prefetch={true} className="block">
      <div className="bg-[#FFFBFE] rounded-3xl shadow-md overflow-hidden hover:shadow-lg transition-shadow flex gap-3 p-3">
        {/* Logo a la izquierda */}
        <div className="w-24 h-24 rounded-2xl overflow-hidden relative bg-gradient-to-br from-[#E8DEF8] to-[#D0BCFF] flex-shrink-0 flex items-center justify-center">
          {professional.profile_image_url ? (
            <Image
              src={professional.profile_image_url || "/placeholder.svg"}
              alt={professional.name}
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
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-semibold text-[#1C1B1F] line-clamp-1">{professional.name}</h3>
            {professional.verified && <BadgeCheck className="w-4 h-4 text-[#6750A4] flex-shrink-0" />}
          </div>

          <div className="flex items-center gap-2 flex-wrap mt-0.5">
            {typeLabel && (
              <span className="text-[10px] uppercase font-bold text-[#6750A4] bg-[#E8DEF8] px-2 py-0.5 rounded-full">
                {typeLabel}
              </span>
            )}
            {professional.emergency_24h && (
              <span className="text-[10px] font-bold text-[#C5221F] bg-[#FDECEA] px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Clock className="w-3 h-3" /> 24h
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 mt-1 text-xs text-[#49454F]">
            <span className="flex items-center gap-1 line-clamp-1">
              <MapPin className="w-3 h-3 flex-shrink-0" /> {professional.location}
            </span>
            {professional.rating != null && (
              <span className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" /> {professional.rating.toFixed(1)}
                {professional.reviews_count ? (
                  <span className="text-[#79747E]">({professional.reviews_count})</span>
                ) : null}
              </span>
            )}
            {professional.price_range && (
              <span className="flex items-center gap-0.5">
                <Tag className="w-3 h-3" /> {professional.price_range}
              </span>
            )}
          </div>

          {professional.short_description && (
            <p className="text-xs text-[#79747E] mt-1 line-clamp-2">{professional.short_description}</p>
          )}
        </div>
      </div>
    </Link>
  )
})
