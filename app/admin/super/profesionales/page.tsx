"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Home, Plus, Pencil, Trash2, MapPin, Star, Check, X } from "lucide-react"
import { PROFESSIONAL_TYPES, type Professional, type ProfessionalType } from "@/lib/professionals-config"

type StatusFilter = "all" | "pending" | "approved" | "rejected"

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente", cls: "text-[#B26A00] bg-[#FFF4E5]" },
  rejected: { label: "Rechazado", cls: "text-[#C5221F] bg-[#FDECEA]" },
  approved: { label: "Aprobado", cls: "text-[#1E7E34] bg-[#E6F4EA]" },
}

export default function SuperProfesionalesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [typeFilter, setTypeFilter] = useState<ProfessionalType | "all">("all")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

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

  async function setStatus(id: string, status: "approved" | "rejected" | "pending") {
    const supabase = createClient()
    const { error } = await supabase.from("professionals").update({ status }).eq("id", id)
    if (error) {
      alert("Error al actualizar el estado")
      return
    }
    setProfessionals((p) => p.map((x) => (x.id === id ? { ...x, status } : x)))
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

  const pendingCount = professionals.filter((p) => p.status === "pending").length
  const filtered = professionals.filter(
    (p) =>
      (typeFilter === "all" || p.type === typeFilter) && (statusFilter === "all" || p.status === statusFilter),
  )

  const statusChips: { id: StatusFilter; label: string }[] = [
    { id: "all", label: `Todas (${professionals.length})` },
    { id: "pending", label: `Pendientes (${pendingCount})` },
    { id: "approved", label: "Aprobadas" },
    { id: "rejected", label: "Rechazadas" },
  ]

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

      {/* Pending banner */}
      {pendingCount > 0 && statusFilter !== "pending" && (
        <button
          onClick={() => setStatusFilter("pending")}
          className="mx-4 mt-3 w-[calc(100%-2rem)] flex items-center justify-between bg-[#FFF4E5] text-[#B26A00] rounded-2xl px-4 py-3 text-sm font-medium"
        >
          <span>
            Tienes {pendingCount} {pendingCount === 1 ? "solicitud pendiente" : "solicitudes pendientes"} de aprobación
          </span>
          <span className="font-semibold underline">Revisar</span>
        </button>
      )}

      {/* Status filter */}
      <div className="px-4 pt-3 flex gap-2 overflow-x-auto">
        {statusChips.map((s) => (
          <button
            key={s.id}
            onClick={() => setStatusFilter(s.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${
              statusFilter === s.id ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Type filter */}
      <div className="px-4 pt-2 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setTypeFilter("all")}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            typeFilter === "all" ? "bg-[#6750A4] text-white" : "bg-[#FFFBFE] text-[#6750A4] border border-[#E8DEF8]"
          }`}
        >
          Todos los tipos
        </button>
        {Object.values(PROFESSIONAL_TYPES).map((t) => (
          <button
            key={t.type}
            onClick={() => setTypeFilter(t.type)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
              typeFilter === t.type ? "bg-[#6750A4] text-white" : "bg-[#FFFBFE] text-[#6750A4] border border-[#E8DEF8]"
            }`}
          >
            {t.labelPlural}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-[#79747E] py-12">No hay profesionales en esta vista.</p>
        ) : (
          filtered.map((p) => {
            const badge = STATUS_BADGE[p.status] || STATUS_BADGE.pending
            return (
              <div key={p.id} className="bg-[#FFFBFE] rounded-3xl p-3 shadow-md">
                <div className="flex items-center gap-3">
                  <img
                    src={p.profile_image_url || "/placeholder.svg?height=64&width=64"}
                    alt={p.name}
                    className="w-16 h-16 rounded-2xl object-cover bg-[#E8DEF8] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase font-bold text-[#6750A4] bg-[#E8DEF8] px-2 py-0.5 rounded-full">
                        {PROFESSIONAL_TYPES[p.type].label}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>
                        {badge.label}
                      </span>
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

                {/* Approval actions */}
                {p.status !== "approved" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setStatus(p.id, "approved")}
                      className="flex-1 flex items-center justify-center gap-1 bg-[#1E7E34] text-white rounded-full h-9 text-sm font-semibold hover:bg-[#176a2b]"
                    >
                      <Check className="w-4 h-4" /> Aprobar
                    </button>
                    {p.status !== "rejected" && (
                      <button
                        onClick={() => setStatus(p.id, "rejected")}
                        className="flex-1 flex items-center justify-center gap-1 bg-[#FDECEA] text-[#C5221F] rounded-full h-9 text-sm font-semibold hover:bg-[#f8d7d4]"
                      >
                        <X className="w-4 h-4" /> Rechazar
                      </button>
                    )}
                  </div>
                )}
                {p.status === "approved" && (
                  <button
                    onClick={() => setStatus(p.id, "pending")}
                    className="mt-3 w-full flex items-center justify-center gap-1 bg-[#F5F5F5] text-[#49454F] rounded-full h-9 text-sm font-medium hover:bg-[#ececec]"
                  >
                    Despublicar (volver a pendiente)
                  </button>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
