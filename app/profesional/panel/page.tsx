"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home, Star, BadgeCheck, ExternalLink, Pencil, Clock, Eye, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ProfessionalForm } from "@/components/professional-form"
import { PROFESSIONAL_TYPES, type Professional } from "@/lib/professionals-config"

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

const STATUS_BANNER: Record<string, { text: string; cls: string }> = {
  pending: { text: "Tu perfil está pendiente de aprobación. Aparecerá en el directorio cuando lo revisemos.", cls: "bg-[#FFF4E5] text-[#B26A00]" },
  approved: { text: "Tu perfil está publicado y visible en el directorio. 🎉", cls: "bg-[#E6F4EA] text-[#1E7E34]" },
  rejected: { text: "Tu perfil no ha sido aprobado. Revisa los datos o contacta con el administrador.", cls: "bg-[#FDECEA] text-[#C5221F]" },
}

export default function ProfesionalPanelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pros, setPros] = useState<Professional[]>([])
  const [selected, setSelected] = useState<Professional | null>(null)
  const [editing, setEditing] = useState(false)
  const [reviews, setReviews] = useState<Review[]>([])

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/login")
        return
      }
      const { data } = await supabase
        .from("professionals")
        .select("*")
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
      const list = (data as Professional[]) || []
      setPros(list)
      if (list.length === 1) setSelected(list[0])
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!selected) return
    const supabase = createClient()
    supabase
      .from("professional_reviews")
      .select("id, rating, comment, created_at, profiles(display_name, avatar_url)")
      .eq("professional_id", selected.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setReviews((data as unknown as Review[]) || []))
  }, [selected])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FEF7FF]">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {editing && (
            <button onClick={() => setEditing(false)} className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
            </button>
          )}
          <h1 className="font-bold text-[#1C1B1F] text-lg">{editing ? "Editar perfil" : "Mi negocio"}</h1>
        </div>
        <Link href="/principal" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#E8DEF8]">
          <Home className="w-5 h-5 text-[#6750A4]" />
        </Link>
      </header>

      <div className="px-4 py-6">
        {pros.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#49454F]">No tienes ningún perfil profesional asociado a tu cuenta.</p>
            <p className="text-[#79747E] text-sm mt-2">Si crees que es un error, contacta con el administrador.</p>
          </div>
        ) : !selected ? (
          <div className="space-y-3">
            <p className="text-sm text-[#49454F] mb-1">Elige el perfil que quieres gestionar:</p>
            {pros.map((p) => (
              <button key={p.id} onClick={() => setSelected(p)} className="w-full bg-[#FFFBFE] rounded-3xl p-3 flex items-center gap-3 shadow-md text-left">
                <img src={p.profile_image_url || "/placeholder.svg?height=56&width=56"} alt={p.name} className="w-14 h-14 rounded-2xl object-cover bg-[#E8DEF8] flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-[#6750A4]">{PROFESSIONAL_TYPES[p.type].label}</p>
                  <p className="font-semibold text-[#1C1B1F] text-sm line-clamp-1">{p.name}</p>
                  <p className="text-xs text-[#79747E] line-clamp-1">{p.location}</p>
                </div>
              </button>
            ))}
          </div>
        ) : editing ? (
          <ProfessionalForm initial={selected} selfService redirectTo="/profesional/panel" />
        ) : (
          /* ---- DASHBOARD ---- */
          <div className="space-y-4">
            {pros.length > 1 && (
              <button onClick={() => setSelected(null)} className="text-sm text-[#6750A4] font-medium">← Elegir otro perfil</button>
            )}

            {/* Identidad */}
            <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 flex items-center gap-4">
              <img src={selected.profile_image_url || "/placeholder.svg?height=72&width=72"} alt={selected.name} className="w-16 h-16 rounded-2xl object-cover bg-[#E8DEF8] flex-shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="font-bold text-[#1C1B1F] line-clamp-1">{selected.name}</h2>
                  {selected.verified && <BadgeCheck className="w-4 h-4 text-[#6750A4]" />}
                </div>
                <p className="text-[10px] uppercase font-bold text-[#6750A4]">{PROFESSIONAL_TYPES[selected.type].label}</p>
                <p className="text-xs text-[#79747E] line-clamp-1">{selected.location}</p>
              </div>
            </div>

            {/* Estado */}
            <div className={`rounded-2xl px-4 py-3 text-sm font-medium flex items-center gap-2 ${(STATUS_BANNER[selected.status] || STATUS_BANNER.pending).cls}`}>
              <Clock className="w-4 h-4 flex-shrink-0" />
              {(STATUS_BANNER[selected.status] || STATUS_BANNER.pending).text}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 fill-[#FFC107] text-[#FFC107]" />
                  <span className="text-xl font-bold text-[#1C1B1F]">{selected.rating != null ? selected.rating.toFixed(1) : "—"}</span>
                </div>
                <p className="text-xs text-[#79747E] mt-1">Valoración media</p>
              </div>
              <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
                <span className="text-xl font-bold text-[#1C1B1F]">{selected.reviews_count || 0}</span>
                <p className="text-xs text-[#79747E] mt-1">Reseñas recibidas</p>
              </div>
            </div>

            {/* Acciones */}
            <div className="grid grid-cols-2 gap-3">
              <Button onClick={() => setEditing(true)} className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 font-semibold">
                <Pencil className="w-4 h-4 mr-1" /> Editar perfil
              </Button>
              {selected.status === "approved" ? (
                <Link href={`/profesional/${selected.id}`}>
                  <Button variant="outline" className="w-full border-[#6750A4] text-[#6750A4] rounded-full h-11 bg-transparent">
                    <Eye className="w-4 h-4 mr-1" /> Ver mi ficha
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" disabled className="w-full border-[#79747E] text-[#79747E] rounded-full h-11 bg-transparent">
                  <ExternalLink className="w-4 h-4 mr-1" /> No publicada
                </Button>
              )}
            </div>

            {/* Reseñas recibidas */}
            <div>
              <h3 className="font-semibold text-[#1C1B1F] mb-2">Reseñas de clientes</h3>
              {reviews.length === 0 ? (
                <p className="text-sm text-[#79747E] bg-[#FFFBFE] rounded-2xl p-4 shadow-sm">Todavía no tienes reseñas.</p>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-[#FFFBFE] rounded-2xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-8 h-8 rounded-full bg-[#6750A4] flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                          {r.profiles?.avatar_url ? (
                            <img src={r.profiles.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                          ) : (
                            r.profiles?.display_name?.[0]?.toUpperCase() || "U"
                          )}
                        </div>
                        <span className="text-sm font-medium text-[#1C1B1F]">{r.profiles?.display_name || "Usuario"}</span>
                        <div className="flex items-center gap-0.5 ml-auto">
                          <Star className="w-3.5 h-3.5 fill-[#FFC107] text-[#FFC107]" />
                          <span className="text-xs font-semibold">{r.rating}</span>
                        </div>
                      </div>
                      {r.comment && <p className="text-sm text-[#49454F]">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
