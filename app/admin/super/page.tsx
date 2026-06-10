"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Building2, Stethoscope, ShoppingBag, Home, ChevronRight, Package, Ticket, MessageSquare, BarChart3 } from "lucide-react"

export default function SuperAdminHubPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [pending, setPending] = useState({ professionals: 0, shelters: 0, orders: 0, feedback: 0 })

  useEffect(() => {
    if (!allowed) return
    const supabase = createClient()
    ;(async () => {
      const [pro, sh, ord, fb] = await Promise.all([
        supabase.from("professionals").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("shelters").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
        supabase.from("app_feedback").select("id", { count: "exact", head: true }).eq("status", "new"),
      ])
      setPending({ professionals: pro.count || 0, shelters: sh.count || 0, orders: ord.count || 0, feedback: fb.count || 0 })
    })()
  }, [allowed])

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
      if (profile?.role === "super_admin" || shelter?.role === "super_admin") {
        setAllowed(true)
      } else {
        router.replace("/adopta")
        return
      }
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  if (!allowed) return null

  const sections = [
    { href: "/admin/super/analiticas", label: "Analíticas", desc: "Ingresos, pedidos y métricas de la app", icon: BarChart3, badge: 0 },
    { href: "/admin/super/protectoras", label: "Protectoras", desc: "Aprobar registros pendientes", icon: Building2, badge: pending.shelters },
    { href: "/admin/super/profesionales", label: "Profesionales", desc: "Veterinarios, adiestradores, paseadores, residencias", icon: Stethoscope, badge: pending.professionals },
    { href: "/admin/super/tienda", label: "Tienda", desc: "Productos, categorías y banners", icon: ShoppingBag, badge: 0 },
    { href: "/admin/super/pedidos", label: "Pedidos", desc: "Gestiona y actualiza el estado de los pedidos", icon: Package, badge: pending.orders },
    { href: "/admin/super/cupones", label: "Cupones", desc: "Códigos de descuento de la tienda", icon: Ticket, badge: 0 },
    { href: "/admin/super/feedback", label: "Sugerencias y bugs", desc: "Feedback de los usuarios", icon: MessageSquare, badge: pending.feedback },
  ]

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-12">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm flex items-center justify-between">
        <h1 className="font-bold text-[#1C1B1F] text-lg">Panel Super Admin</h1>
        <Link href="/adopta" className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-[#E8DEF8]">
          <Home className="w-5 h-5 text-[#6750A4]" />
        </Link>
      </header>
      <div className="px-4 py-6 space-y-3">
        {sections.map((s) => {
          const Icon = s.icon
          return (
            <Link
              key={s.href}
              href={s.href}
              className="flex items-center gap-4 bg-[#FFFBFE] rounded-3xl p-4 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="w-12 h-12 bg-[#E8DEF8] rounded-full flex items-center justify-center flex-shrink-0">
                <Icon className="w-6 h-6 text-[#6750A4]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-[#1C1B1F]">{s.label}</h2>
                  {s.badge > 0 && (
                    <span className="bg-[#D32F2F] text-white text-xs font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">
                      {s.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#79747E] line-clamp-1">{s.desc}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#79747E]" />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
