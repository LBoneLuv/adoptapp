"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Euro, ShoppingBag, TrendingUp, Users, Package, Stethoscope, Building2, PawPrint, AlertTriangle } from "lucide-react"
import { BarChart, Bar, XAxis, ResponsiveContainer, Tooltip } from "recharts"
import { ORDER_STATUS } from "@/lib/order-status"

interface Analytics {
  revenue: number
  avgOrder: number
  totalOrders: number
  paidOrders: number
  ordersByStatus: Record<string, number>
  topProducts: { name: string; image: string | null; qty: number }[]
  days: { date: string; label: string; revenue: number; orders: number }[]
  counts: { users: number; products: number; lowStock: number; professionals: number; shelters: number; animals: number }
}

export default function AnaliticasPage() {
  const router = useRouter()
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          router.replace("/adopta")
          return null
        }
        return res.json()
      })
      .then((d) => {
        if (d) setData(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }
  if (!data) return null

  const kpis = [
    { label: "Ingresos", value: `${data.revenue.toFixed(2)}€`, icon: Euro, accent: "#1E7E34" },
    { label: "Pedidos pagados", value: data.paidOrders, icon: ShoppingBag, accent: "#6750A4" },
    { label: "Ticket medio", value: `${data.avgOrder.toFixed(2)}€`, icon: TrendingUp, accent: "#6750A4" },
    { label: "Usuarios", value: data.counts.users, icon: Users, accent: "#6750A4" },
    { label: "Productos", value: data.counts.products, icon: Package, accent: "#6750A4" },
    { label: "Profesionales", value: data.counts.professionals, icon: Stethoscope, accent: "#6750A4" },
    { label: "Protectoras", value: data.counts.shelters, icon: Building2, accent: "#6750A4" },
    { label: "Animales", value: data.counts.animals, icon: PawPrint, accent: "#6750A4" },
  ]

  const maxQty = Math.max(1, ...data.topProducts.map((p) => p.qty))

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-12">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <Link href="/admin/super" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-lg">Analíticas</h1>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* KPIs */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((k) => {
            const Icon = k.icon
            return (
              <div key={k.label} className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
                <div className="w-9 h-9 rounded-full bg-[#E8DEF8] flex items-center justify-center mb-2">
                  <Icon className="w-5 h-5" style={{ color: k.accent }} />
                </div>
                <p className="text-xl font-bold text-[#1C1B1F]">{k.value}</p>
                <p className="text-xs text-[#79747E]">{k.label}</p>
              </div>
            )
          })}
        </div>

        {data.counts.lowStock > 0 && (
          <Link href="/admin/super/tienda" className="flex items-center gap-2 bg-[#FFF4E5] text-[#B26A00] rounded-2xl px-4 py-3 text-sm font-medium">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            {data.counts.lowStock} producto(s) con stock bajo (≤5)
          </Link>
        )}

        {/* Ingresos últimos 14 días */}
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
          <h2 className="font-semibold text-[#1C1B1F] mb-3">Ingresos (últimos 14 días)</h2>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.days} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#79747E" }} interval={1} axisLine={false} tickLine={false} />
              <Tooltip
                formatter={(v: number) => [`${Number(v).toFixed(2)}€`, "Ingresos"]}
                contentStyle={{ borderRadius: 12, border: "1px solid #E8DEF8", fontSize: 12 }}
              />
              <Bar dataKey="revenue" fill="#6750A4" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pedidos por estado */}
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
          <h2 className="font-semibold text-[#1C1B1F] mb-3">Pedidos por estado</h2>
          <div className="space-y-2">
            {Object.entries(data.ordersByStatus).length === 0 ? (
              <p className="text-sm text-[#79747E]">Aún no hay pedidos.</p>
            ) : (
              Object.entries(data.ordersByStatus).map(([status, count]) => {
                const meta = ORDER_STATUS[status] || ORDER_STATUS.pending
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${meta.cls}`}>{meta.label}</span>
                    <span className="font-semibold text-[#1C1B1F]">{count}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Top productos */}
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
          <h2 className="font-semibold text-[#1C1B1F] mb-3">Productos más vendidos</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-sm text-[#79747E]">Aún no hay ventas.</p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((p) => (
                <div key={p.name} className="flex items-center gap-3">
                  <img src={p.image || "/placeholder.svg"} alt="" className="w-10 h-10 rounded-xl object-cover bg-[#E8DEF8] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1C1B1F] line-clamp-1">{p.name}</p>
                    <div className="h-1.5 bg-[#E8DEF8] rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-[#6750A4] rounded-full" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[#6750A4] flex-shrink-0">{p.qty} ud.</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
