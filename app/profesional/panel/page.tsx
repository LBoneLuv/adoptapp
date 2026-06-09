"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Home } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ProfessionalForm } from "@/components/professional-form"
import { PROFESSIONAL_TYPES, type Professional } from "@/lib/professionals-config"

export default function ProfesionalPanelPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [pros, setPros] = useState<Professional[]>([])
  const [selected, setSelected] = useState<Professional | null>(null)

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
        <h1 className="font-bold text-[#1C1B1F] text-lg">
          {selected ? `Editar: ${selected.name}` : "Mi negocio"}
        </h1>
        <Link href="/principal" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#E8DEF8]">
          <Home className="w-5 h-5 text-[#6750A4]" />
        </Link>
      </header>

      <div className="px-4 py-6">
        {pros.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-[#49454F]">No tienes ningún perfil profesional asociado a tu cuenta.</p>
            <p className="text-[#79747E] text-sm mt-2">
              Si crees que es un error, contacta con el administrador para que lo vincule.
            </p>
          </div>
        ) : !selected ? (
          // Varios negocios: elegir cuál editar
          <div className="space-y-3">
            <p className="text-sm text-[#49454F] mb-1">Elige el perfil que quieres editar:</p>
            {pros.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelected(p)}
                className="w-full bg-[#FFFBFE] rounded-3xl p-3 flex items-center gap-3 shadow-md text-left"
              >
                <img
                  src={p.profile_image_url || "/placeholder.svg?height=56&width=56"}
                  alt={p.name}
                  className="w-14 h-14 rounded-2xl object-cover bg-[#E8DEF8] flex-shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-[10px] uppercase font-bold text-[#6750A4]">{PROFESSIONAL_TYPES[p.type].label}</p>
                  <p className="font-semibold text-[#1C1B1F] text-sm line-clamp-1">{p.name}</p>
                  <p className="text-xs text-[#79747E] line-clamp-1">{p.location}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <>
            {pros.length > 1 && (
              <button onClick={() => setSelected(null)} className="text-sm text-[#6750A4] font-medium mb-4">
                ← Elegir otro perfil
              </button>
            )}
            <ProfessionalForm initial={selected} selfService redirectTo="/profesional/panel" />
          </>
        )}
      </div>
    </div>
  )
}
