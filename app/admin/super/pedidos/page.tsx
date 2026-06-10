"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft } from "lucide-react"
import { ORDER_STATUS, ORDER_STATUS_OPTIONS } from "@/lib/order-status"

interface OrderItem {
  id: string
  product_name: string
  image_url: string | null
  unit_price: number
  quantity: number
}
interface Order {
  id: string
  status: string
  total: number
  discount: number | null
  coupon_code: string | null
  created_at: string
  shipping_name: string | null
  shipping_email: string | null
  shipping_phone: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_postal_code: string | null
  order_items: OrderItem[]
}

type Filter = "all" | string

export default function SuperPedidosPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [orders, setOrders] = useState<Order[]>([])
  const [filter, setFilter] = useState<Filter>("all")

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
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false })
      setOrders((data as Order[]) || [])
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function changeStatus(id: string, status: string) {
    const res = await fetch("/api/admin/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, status }),
    })
    if (!res.ok) {
      alert("Error al actualizar el estado")
      return
    }
    setOrders((o) => o.map((x) => (x.id === id ? { ...x, status } : x)))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }
  if (!allowed) return null

  const counts: Record<string, number> = {}
  for (const o of orders) counts[o.status] = (counts[o.status] || 0) + 1
  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter)

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-24">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <Link href="/admin/super" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-lg">Pedidos</h1>
      </header>

      {/* Status filter */}
      <div className="px-4 pt-3 flex gap-2 overflow-x-auto">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === "all" ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"}`}
        >
          Todos ({orders.length})
        </button>
        {ORDER_STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === s ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"}`}
          >
            {ORDER_STATUS[s].label} ({counts[s] || 0})
          </button>
        ))}
      </div>

      <div className="px-4 py-3 space-y-3">
        {filtered.length === 0 ? (
          <p className="text-center text-[#79747E] py-12">No hay pedidos en esta vista.</p>
        ) : (
          filtered.map((order) => {
            const badge = ORDER_STATUS[order.status] || ORDER_STATUS.pending
            return (
              <div key={order.id} className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs text-[#79747E]">#{order.id.slice(0, 8).toUpperCase()} · {new Date(order.created_at).toLocaleDateString()}</p>
                    <p className="font-bold text-[#1C1B1F]">{order.total.toFixed(2)}€</p>
                  </div>
                  <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
                </div>

                {/* Envío */}
                <div className="text-xs text-[#49454F] bg-[#FEF7FF] rounded-xl p-2 mb-2">
                  <p className="font-medium text-[#1C1B1F]">{order.shipping_name || "—"}</p>
                  <p>{order.shipping_address}, {order.shipping_postal_code} {order.shipping_city}</p>
                  <p>{order.shipping_phone} · {order.shipping_email}</p>
                  {order.coupon_code && (
                    <p className="text-[#1E7E34] mt-1">Cupón {order.coupon_code} (−{(order.discount || 0).toFixed(2)}€)</p>
                  )}
                </div>

                {/* Items */}
                <div className="space-y-1 mb-3">
                  {order.order_items?.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-[#1C1B1F] line-clamp-1">{item.quantity}× {item.product_name}</span>
                      <span className="text-[#79747E] flex-shrink-0 ml-2">{(item.unit_price * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>

                {/* Cambiar estado */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#79747E]">Estado:</span>
                  <select
                    value={order.status}
                    onChange={(e) => changeStatus(order.id, e.target.value)}
                    className="flex-1 px-3 py-2 border-2 border-[#79747E] rounded-xl text-sm bg-[#FFFBFE] focus:border-[#6750A4] focus:outline-none"
                  >
                    {ORDER_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {ORDER_STATUS[s].label}
                      </option>
                    ))}
                  </select>
                </div>

                <Link
                  href={`/admin/super/pedidos/${order.id}`}
                  className="block text-center text-sm text-[#6750A4] font-medium mt-3 pt-3 border-t border-[#E8DEF8]"
                >
                  Ver detalle completo →
                </Link>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
