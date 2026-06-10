"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Check, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface Order {
  id: string
  total: number
  order_items: { id: string; product_name: string; quantity: number; unit_price: number }[]
}

export default function PedidoOkPage() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order")
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) return
    const supabase = createClient()
    supabase
      .from("orders")
      .select("id, total, order_items(id, product_name, quantity, unit_price)")
      .eq("id", orderId)
      .maybeSingle()
      .then(({ data }) => setOrder(data as Order))
  }, [orderId])

  return (
    <div className="min-h-screen bg-[#FEF7FF] px-4 py-8 flex flex-col items-center">
      <div className="w-20 h-20 rounded-full bg-[#E6F4EA] flex items-center justify-center mb-4">
        <Check className="w-10 h-10 text-[#1E7E34]" />
      </div>
      <h1 className="text-2xl font-bold text-[#1C1B1F] text-center">¡Pedido realizado!</h1>
      <p className="text-[#49454F] mt-2 text-center">Gracias por tu compra. Te enviaremos las novedades por email.</p>
      {orderId && (
        <p className="text-sm text-[#79747E] mt-1">
          Nº de pedido: <strong className="text-[#1C1B1F]">#{orderId.slice(0, 8).toUpperCase()}</strong>
        </p>
      )}

      {order && (
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 w-full max-w-md mt-6">
          <div className="space-y-2">
            {order.order_items?.map((i) => (
              <div key={i.id} className="flex justify-between text-sm">
                <span className="text-[#1C1B1F] line-clamp-1">{i.quantity}× {i.product_name}</span>
                <span className="text-[#79747E] flex-shrink-0 ml-2">{(i.unit_price * i.quantity).toFixed(2)}€</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-[#1C1B1F] pt-3 mt-3 border-t border-[#E8DEF8]">
            <span>Total</span>
            <span className="text-[#6750A4]">{order.total.toFixed(2)}€</span>
          </div>
        </div>
      )}

      <div className="w-full max-w-md mt-6 space-y-3">
        <Link href="/tienda/pedidos" className="block">
          <Button className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold">
            <Package className="w-5 h-5 mr-2" /> Ver mis pedidos
          </Button>
        </Link>
        <Link href="/tienda" className="block">
          <Button variant="outline" className="w-full rounded-full border-[#6750A4] text-[#6750A4] h-12 bg-transparent">
            Seguir comprando
          </Button>
        </Link>
      </div>
    </div>
  )
}
