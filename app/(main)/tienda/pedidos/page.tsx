"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Package } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ORDER_STATUS } from "@/lib/order-status"

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
  order_items: OrderItem[]
}

export default function PedidosPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/login")
        return
      }
      const { data } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setOrders((data as Order[]) || [])
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] bg-[#FEF7FF] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-[#E8DEF8] flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-[#6750A4]" />
        </div>
        <p className="text-[#49454F]">Todavía no tienes pedidos</p>
        <Link href="/tienda" className="mt-4">
          <Button variant="outline" className="rounded-full border-[#6750A4] text-[#6750A4] bg-transparent">
            Ir a la tienda
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FEF7FF] px-4 py-4 pb-24 space-y-4">
      {orders.map((order) => {
        const badge = ORDER_STATUS[order.status] || ORDER_STATUS.pending
        return (
          <div key={order.id} className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-[#79747E]">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-[#79747E]">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-[11px] font-bold px-3 py-1 rounded-full ${badge.cls}`}>{badge.label}</span>
            </div>

            <div className="space-y-2">
              {order.order_items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.image_url || "/placeholder.svg"}
                    alt={item.product_name}
                    className="w-12 h-12 rounded-xl object-cover bg-[#E8DEF8] flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1C1B1F] line-clamp-1">{item.product_name}</p>
                    <p className="text-xs text-[#79747E]">
                      {item.quantity} × {item.unit_price.toFixed(2)}€
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E8DEF8] mt-3 pt-3 flex items-center justify-between">
              {order.coupon_code ? (
                <span className="text-xs text-[#1E7E34]">
                  Cupón {order.coupon_code} (−{(order.discount || 0).toFixed(2)}€)
                </span>
              ) : (
                <span />
              )}
              <span className="font-bold text-[#1C1B1F]">Total: {order.total.toFixed(2)}€</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
