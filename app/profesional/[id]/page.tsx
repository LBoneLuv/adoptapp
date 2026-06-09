"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  MapPin,
  Globe,
  Facebook,
  Instagram,
  Phone,
  Mail,
  MessageCircle,
  Navigation,
  Star,
  BadgeCheck,
  Clock,
  Tag,
} from "lucide-react"
import { PROFESSIONAL_TYPES, type Professional } from "@/lib/professionals-config"
import { ProfessionalReviews } from "@/components/professional-reviews"

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

export default function ProfesionalDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [pro, setPro] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)
  const [galleryIndex, setGalleryIndex] = useState(0)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    const fetchData = async () => {
      const { data } = await supabase.from("professionals").select("*").eq("id", id).single()
      if (data) setPro(data as Professional)
      setLoading(false)
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  if (!pro) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7FF]">
        <p className="text-lg text-[#49454F] mb-4">No se encontró el profesional</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  const typeConfig = PROFESSIONAL_TYPES[pro.type]
  const gallery = pro.gallery_images?.filter(Boolean) || []
  const mapsQuery = encodeURIComponent(pro.address || `${pro.name}, ${pro.location}`)
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`
  const phoneDigits = (pro.whatsapp || pro.phone || "").replace(/[^\d+]/g, "")

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-28">
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {pro.cover_image_url ? (
          <img src={pro.cover_image_url || "/placeholder.svg"} alt={pro.name} className="w-full h-48 object-cover" />
        ) : (
          <div className="w-full h-48 bg-gradient-to-br from-[#E8DEF8] to-[#D0BCFF]" />
        )}
      </div>

      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {pro.profile_image_url ? (
              <img
                src={pro.profile_image_url || "/placeholder.svg"}
                alt={pro.name}
                className="w-28 h-28 rounded-full border-4 border-[#FEF7FF] object-cover bg-[#E8DEF8]"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-[#FEF7FF] bg-[#E8DEF8] flex items-center justify-center">
                <span className="text-4xl">🐾</span>
              </div>
            )}
          </div>

          {(pro.website || (pro.social_links && pro.social_links.length > 0)) && (
            <div className="flex gap-2 mt-20 flex-wrap">
              {pro.website && (
                <a
                  href={pro.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#6750A4]/10 flex items-center justify-center hover:bg-[#6750A4]/20 transition-colors text-[#6750A4]"
                >
                  <Globe className="w-4 h-4" />
                </a>
              )}
              {pro.social_links?.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-[#6750A4]/10 flex items-center justify-center hover:bg-[#6750A4]/20 transition-colors text-[#6750A4]"
                >
                  <SocialIcon platform={link.platform} />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Name + meta */}
        <div className="mt-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#E8DEF8] text-[#6750A4] text-xs font-semibold px-3 py-1 rounded-full">
              {typeConfig.label}
            </span>
            {pro.verified && (
              <span className="flex items-center gap-1 bg-[#E6F4EA] text-[#1E7E34] text-xs font-semibold px-3 py-1 rounded-full">
                <BadgeCheck className="w-3.5 h-3.5" /> Verificado
              </span>
            )}
            {pro.emergency_24h && (
              <span className="bg-[#FDECEA] text-[#C5221F] text-xs font-semibold px-3 py-1 rounded-full">
                Urgencias 24h
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-[#1C1B1F] mt-2">{pro.name}</h1>

          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <div className="flex items-center text-[#49454F]">
              <MapPin className="w-4 h-4 mr-1" />
              <span className="text-sm">{pro.address || pro.location}</span>
            </div>
            {pro.rating != null && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-[#FFC107] text-[#FFC107]" />
                <span className="text-sm font-medium text-[#1C1B1F]">{pro.rating.toFixed(1)}</span>
                {pro.reviews_count ? (
                  <span className="text-xs text-[#79747E]">({pro.reviews_count})</span>
                ) : null}
              </div>
            )}
            {pro.price_range && (
              <span className="flex items-center gap-1 text-sm text-[#49454F]">
                <Tag className="w-4 h-4" /> {pro.price_range}
              </span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          {pro.phone && (
            <a
              href={`tel:${pro.phone.replace(/\s/g, "")}`}
              className="flex flex-col items-center justify-center gap-1 bg-[#FFFBFE] rounded-2xl py-3 shadow-sm hover:bg-[#E8DEF8] transition-colors"
            >
              <Phone className="w-5 h-5 text-[#6750A4]" />
              <span className="text-xs font-medium text-[#1C1B1F]">Llamar</span>
            </a>
          )}
          {phoneDigits && (
            <a
              href={`https://wa.me/${phoneDigits.replace(/^\+/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-1 bg-[#FFFBFE] rounded-2xl py-3 shadow-sm hover:bg-[#E8DEF8] transition-colors"
            >
              <MessageCircle className="w-5 h-5 text-[#25D366]" />
              <span className="text-xs font-medium text-[#1C1B1F]">WhatsApp</span>
            </a>
          )}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1 bg-[#FFFBFE] rounded-2xl py-3 shadow-sm hover:bg-[#E8DEF8] transition-colors"
          >
            <Navigation className="w-5 h-5 text-[#6750A4]" />
            <span className="text-xs font-medium text-[#1C1B1F]">Cómo llegar</span>
          </a>
          {pro.email && (
            <a
              href={`mailto:${pro.email}`}
              className="flex flex-col items-center justify-center gap-1 bg-[#FFFBFE] rounded-2xl py-3 shadow-sm hover:bg-[#E8DEF8] transition-colors"
            >
              <Mail className="w-5 h-5 text-[#6750A4]" />
              <span className="text-xs font-medium text-[#1C1B1F]">Email</span>
            </a>
          )}
        </div>

        {/* About */}
        {pro.description && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[#1C1B1F] mb-2">Sobre {pro.name}</h2>
            <div
              className="text-[#49454F] text-sm leading-relaxed prose-sm [&_p]:mb-2 [&_strong]:text-[#1C1B1F]"
              dangerouslySetInnerHTML={{ __html: pro.description }}
            />
          </div>
        )}

        {/* Services */}
        {pro.services && pro.services.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[#1C1B1F] mb-3">Servicios</h2>
            <div className="space-y-2">
              {pro.services.map((service, i) => (
                <div
                  key={i}
                  className="flex items-start justify-between gap-3 bg-[#FFFBFE] rounded-2xl p-3 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-[#1C1B1F]">{service.name}</p>
                    {service.description && (
                      <p className="text-xs text-[#79747E] mt-0.5">{service.description}</p>
                    )}
                  </div>
                  {service.price && (
                    <span className="flex-shrink-0 text-sm font-bold text-[#6750A4]">{service.price}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Schedule */}
        {pro.schedule && pro.schedule.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[#1C1B1F] mb-3 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#6750A4]" /> Horario
            </h2>
            <div className="bg-[#FFFBFE] rounded-2xl p-4 shadow-sm divide-y divide-[#E8DEF8]">
              {pro.schedule.map((d, i) => {
                const closed = !d.open || !d.close
                const allDay = d.open === "00:00" && (d.close === "23:59" || d.close === "00:00")
                return (
                  <div key={i} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-[#1C1B1F]">{d.day}</span>
                    <span className={`text-sm ${closed ? "text-[#C5221F]" : "text-[#49454F]"}`}>
                      {closed ? "Cerrado" : allDay ? "24 horas" : `${d.open} - ${d.close}`}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Gallery */}
        {gallery.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[#1C1B1F] mb-3">Galería</h2>
            <div className="relative rounded-2xl overflow-hidden">
              <img
                src={gallery[galleryIndex] || "/placeholder.svg"}
                alt={`${pro.name} ${galleryIndex + 1}`}
                className="w-full h-56 object-cover"
              />
              {gallery.length > 1 && (
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                  {gallery.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setGalleryIndex(i)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        i === galleryIndex ? "bg-white w-6" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reseñas */}
        <ProfessionalReviews professionalId={pro.id} />
      </div>
    </div>
  )
}
