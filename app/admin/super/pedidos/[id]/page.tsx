"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, MapPin, Phone, Mail, User, Tag } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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
  shipping_cost: number | null
  shipping_method: string | null
  coupon_code: string | null
  currency: string
  created_at: string
  shipping_name: string | null
  shipping_email: string | null
  shipping_phone: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_postal_code: string | null
  order_items: OrderItem[]
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const id = params?.id as string
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setOrder(data as Order)
        setLoading(false)
      })
  }, [id])

  async function changeStatus(status: string) {
    setSaving(true)
    const res = await fetch("/api/admin/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: id, status }),
    })
    setSaving(false)
    if (!res.ok) {
      alert("Error al actualizar el estado")
      return
    }
    setOrder((o) => (o ? { ...o, status } : o))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6750A4]" />
      </div>
    )
  }
  if (!order) {
    return <div className="min-h-screen bg-[#FEF7FF] p-8 text-center text-[#79747E]">No se encontró el pedido.</div>
  }

  const badge = ORDER_STATUS[order.status] || ORDER_STATUS.pending
  const shippingCost = order.shipping_cost || 0
  const subtotal = order.total - shippingCost + (order.discount || 0)

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-12">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10 flex items-center gap-3">
        <Link href="/admin/super/pedidos" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <div>
          <h1 className="font-bold text-[#1C1B1F] text-base">Pedido #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p className="text-xs text-[#79747E]">{new Date(order.created_at).toLocaleString()}</p>
        </div>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Estado */}
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-[#1C1B1F]">Estado del pedido</span>
            <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
          </div>
          <select
            value={order.status}
            onChange={(e) => changeStatus(e.target.value)}
            disabled={saving}
            className="w-full px-3 py-2.5 border-2 border-[#79747E] rounded-xl text-sm bg-[#FFFBFE] focus:border-[#6750A4] focus:outline-none disabled:opacity-50"
          >
            {ORDER_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS[s].label}
              </option>
            ))}
          </select>
          <p className="text-xs text-[#79747E] mt-2">Al cambiar el estado se avisa al cliente por email y push.</p>
        </div>

        {/* Cliente / envío */}
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 space-y-2">
          <h2 className="text-sm font-semibold text-[#1C1B1F] mb-1">Datos de envío</h2>
          <p className="flex items-center gap-2 text-sm text-[#1C1B1F]">
            <User className="w-4 h-4 text-[#6750A4]" /> {order.shipping_name || "—"}
          </p>
          <p className="flex items-center gap-2 text-sm text-[#49454F]">
            <MapPin className="w-4 h-4 text-[#6750A4]" /> {order.shipping_address}, {order.shipping_postal_code}{" "}
            {order.shipping_city}
          </p>
          {order.shipping_phone && (
            <a href={`tel:${order.shipping_phone}`} className="flex items-center gap-2 text-sm text-[#6750A4]">
              <Phone className="w-4 h-4" /> {order.shipping_phone}
            </a>
          )}
          {order.shipping_email && (
            <a href={`mailto:${order.shipping_email}`} className="flex items-center gap-2 text-sm text-[#6750A4]">
              <Mail className="w-4 h-4" /> {order.shipping_email}
            </a>
          )}
        </div>

        {/* Artículos */}
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
          <h2 className="text-sm font-semibold text-[#1C1B1F] mb-3">Artículos</h2>
          <div className="space-y-3">
            {order.order_items?.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <img
                  src={item.image_url || "/placeholder.svg"}
                  alt={item.product_name}
                  className="w-14 h-14 rounded-xl object-cover bg-[#E8DEF8] flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#1C1B1F] line-clamp-1">{item.product_name}</p>
                  <p className="text-xs text-[#79747E]">
                    {item.quantity} × {item.unit_price.toFixed(2)}€
                  </p>
                </div>
                <span className="text-sm font-medium text-[#1C1B1F]">
                  {(item.unit_price * item.quantity).toFixed(2)}€
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-[#E8DEF8] mt-4 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-[#49454F]">
              <span>Subtotal</span>
              <span>{subtotal.toFixed(2)}€</span>
            </div>
            {order.discount && order.discount > 0 ? (
              <div className="flex justify-between text-[#1E7E34]">
                <span className="flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Descuento {order.coupon_code ? `(${order.coupon_code})` : ""}
                </span>
                <span>−{order.discount.toFixed(2)}€</span>
              </div>
            ) : null}
            <div className="flex justify-between text-[#49454F]">
              <span>Envío{order.shipping_method ? ` (${order.shipping_method === "express" ? "exprés" : "estándar"})` : ""}</span>
              <span>{shippingCost === 0 ? "Gratis" : `${shippingCost.toFixed(2)}€`}</span>
            </div>
            <div className="flex justify-between font-bold text-[#1C1B1F] pt-1">
              <span>Total</span>
              <span className="text-[#6750A4]">{order.total.toFixed(2)}€</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
