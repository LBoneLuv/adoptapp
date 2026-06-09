"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Home, Plus, Pencil, Trash2, MapPin, Star } from "lucide-react"
import { PROFESSIONAL_TYPES, type Professional, type ProfessionalType } from "@/lib/professionals-config"

export default function SuperProfesionalesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [filter, setFilter] = useState<ProfessionalType | "all">("all")

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
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
      const { data: shelter } = await supabase.from("shelters").select("role").eq("id", user.id).maybeSingle()
      const isSuper = profile?.role === "super_admin" || shelter?.role === "super_admin"
      if (!isSuper) {
        router.replace("/adopta")
        return
      }
      setAllowed(true)
      await load()
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from("professionals").select("*").order("created_at", { ascending: false })
    setProfessionals((data as Professional[]) || [])
  }

  async function remove(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return
    const supabase = createClient()
    const { error } = await supabase.from("professionals").delete().eq("id", id)
    if (error) {
      alert("Error al eliminar")
      return
    }
    setProfessionals((p) => p.filter((x) => x.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }
  if (!allowed) return null

  const filtered = filter === "all" ? professionals : professionals.filter((p) => p.type === filter)

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-24">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <h1 className="font-bold text-[#1C1B1F] text-lg">Profesionales</h1>
        <div className="flex items-center gap-2">
          <Link href="/admin/super/profesionales/nuevo">
            <Button className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-10">
              <Plus className="w-4 h-4 mr-1" /> Añadir
            </Button>
          </Link>
          <Link href="/adopta" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#E8DEF8]">
            <Home className="w-5 h-5 text-[#6750A4]" />
          </Link>
        </div>
      </header>

      {/* Type filter */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
            filter === "all" ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"
          }`}
        >
          Todos ({professionals.length})
        </button>
        {Object.values(PROFESSIONAL_TYPES).map((t) => {
          const count = professionals.filter((p) => p.type === t.type).length
          return (
            <button
              key={t.type}
              onClick={() => setFilter(t.type)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
                filter === t.type ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"
              }`}
            >
              {t.labelPlural} ({count})
            </button>
          )
        })}
      </div>

      <div className="px-4 py-2 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-[#79747E] py-12">No hay profesionales todavía.</p>
        ) : (
          filtered.map((p) => (
            <div key={p.id} className="bg-[#FFFBFE] rounded-3xl p-3 flex items-center gap-3 shadow-md">
              <img
                src={p.profile_image_url || "/placeholder.svg?height=64&width=64"}
                alt={p.name}
                className="w-16 h-16 rounded-2xl object-cover bg-[#E8DEF8] flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-[#6750A4] bg-[#E8DEF8] px-2 py-0.5 rounded-full">
                    {PROFESSIONAL_TYPES[p.type].label}
                  </span>
                  {p.status !== "approved" && (
                    <span className="text-[10px] font-bold text-[#C5221F] bg-[#FDECEA] px-2 py-0.5 rounded-full">
                      {p.status}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[#1C1B1F] text-sm line-clamp-1 mt-0.5">{p.name}</h3>
                <div className="flex items-center gap-2 text-xs text-[#79747E]">
                  <span className="flex items-center gap-0.5">
                    <MapPin className="w-3 h-3" /> {p.location}
                  </span>
                  {p.rating != null && (
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" /> {p.rating}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/admin/super/profesionales/${p.id}`}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E8DEF8] hover:bg-[#D0BCFF]"
                >
                  <Pencil className="w-4 h-4 text-[#6750A4]" />
                </Link>
                <button
                  onClick={() => remove(p.id, p.name)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#FDECEA] hover:bg-[#f8d7d4]"
                >
                  <Trash2 className="w-4 h-4 text-[#C5221F]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
