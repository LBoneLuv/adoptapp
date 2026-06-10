"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Lightbulb, Wrench, Bug } from "lucide-react"

interface Feedback {
  id: string
  type: string
  message: string
  email: string | null
  status: string
  created_at: string
}

const TYPE_META: Record<string, { label: string; icon: any; cls: string }> = {
  sugerencia: { label: "Sugerencia", icon: Lightbulb, cls: "text-[#B26A00] bg-[#FFF4E5]" },
  mejora: { label: "Mejora", icon: Wrench, cls: "text-[#6750A4] bg-[#E8DEF8]" },
  bug: { label: "Bug", icon: Bug, cls: "text-[#C5221F] bg-[#FDECEA]" },
}

export default function FeedbackAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [items, setItems] = useState<Feedback[]>([])
  const [filter, setFilter] = useState<string>("all")

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
      const { data: sh } = await supabase.from("shelters").select("role").eq("id", user.id).maybeSingle()
      if (profile?.role !== "super_admin" && sh?.role !== "super_admin") {
        router.replace("/adopta")
        return
      }
      setAllowed(true)
      const { data } = await supabase.from("app_feedback").select("*").order("created_at", { ascending: false })
      setItems((data as Feedback[]) || [])
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function setStatus(id: string, status: string) {
    const supabase = createClient()
    await supabase.from("app_feedback").update({ status }).eq("id", id)
    setItems((it) => it.map((x) => (x.id === id ? { ...x, status } : x)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }
  if (!allowed) return null

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter)

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-24">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <Link href="/admin/super" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-lg">Sugerencias y bugs</h1>
      </header>

      <div className="px-4 pt-3 flex gap-2 overflow-x-auto">
        {[
          { id: "all", label: `Todo (${items.length})` },
          { id: "sugerencia", label: "Sugerencias" },
          { id: "mejora", label: "Mejoras" },
          { id: "bug", label: "Bugs" },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === f.id ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="px-4 py-3 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-[#79747E] py-12">No hay feedback en esta vista.</p>
        ) : (
          filtered.map((f) => {
            const meta = TYPE_META[f.type] || TYPE_META.sugerencia
            const Icon = meta.icon
            return (
              <div key={f.id} className={`bg-[#FFFBFE] rounded-3xl shadow-md p-4 ${f.status === "done" ? "opacity-60" : ""}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1 ${meta.cls}`}>
                    <Icon className="w-3.5 h-3.5" /> {meta.label}
                  </span>
                  <span className="text-xs text-[#79747E]">{new Date(f.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm text-[#1C1B1F] whitespace-pre-wrap">{f.message}</p>
                {f.email && <p className="text-xs text-[#79747E] mt-2">{f.email}</p>}
                <div className="flex gap-2 mt-3">
                  {["new", "reviewed", "done"].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(f.id, s)}
                      className={`px-3 py-1 rounded-full text-xs font-medium ${f.status === s ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"}`}
                    >
                      {s === "new" ? "Nuevo" : s === "reviewed" ? "Revisado" : "Hecho"}
                    </button>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
