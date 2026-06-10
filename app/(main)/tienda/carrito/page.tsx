"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Minus, Plus, Trash2, ShoppingBag, Heart, Truck } from "lucide-react"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping"

interface CartLine {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image_url: string | null
    stock: number
  } | null
}

export default function CarritoPage() {
  const router = useRouter()
  const [lines, setLines] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
      .from("cart_items")
      .select("id, quantity, product:shop_products(id, name, price, image_url, stock)")
      .eq("user_id", user.id)
    // Ajustar cantidades que superen el stock
    const rows = (data as unknown as CartLine[]) || []
    for (const l of rows) {
      if (l.product && l.quantity > l.product.stock && l.product.stock > 0) {
        l.quantity = l.product.stock
        await supabase.from("cart_items").update({ quantity: l.product.stock }).eq("id", l.id)
      }
    }
    setLines(rows)
    setLoading(false)
  }

  async function updateQty(line: CartLine, delta: number) {
    if (!line.product) return
    const newQty = Math.max(1, Math.min(line.product.stock, line.quantity + delta))
    if (newQty === line.quantity) return
    setLines((ls) => ls.map((l) => (l.id === line.id ? { ...l, quantity: newQty } : l)))
    const supabase = createClient()
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", line.id)
  }

  async function removeLine(id: string) {
    setLines((ls) => ls.filter((l) => l.id !== id))
    const supabase = createClient()
    await supabase.from("cart_items").delete().eq("id", id)
    window.dispatchEvent(new Event("cart-updated"))
  }

  async function moveToFavorites(line: CartLine) {
    if (!line.product) return
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      await supabase.from("product_favorites").upsert(
        { user_id: user.id, product_id: line.product.id },
        { onConflict: "user_id,product_id" },
      )
    }
    await removeLine(line.id)
  }

  const subtotal = lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.quantity : 0), 0)
  const missingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal)
  const freeProgress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] bg-[#FEF7FF] text-center px-6">
        <div className="w-16 h-16 rounded-full bg-[#E8DEF8] flex items-center justify-center mb-4">
          <ShoppingBag className="w-8 h-8 text-[#6750A4]" />
        </div>
        <p className="text-[#49454F]">Tu carrito está vacío</p>
        <Link href="/tienda" className="mt-4">
          <Button variant="outline" className="rounded-full border-[#6750A4] text-[#6750A4]">
            Ir a la tienda
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-40">
        {/* Barra de envío gratis */}
        <div className="bg-[#FFFBFE] rounded-3xl p-4 shadow-md">
          <p className="text-sm text-[#1C1B1F] flex items-center gap-2 mb-2">
            <Truck className="w-4 h-4 text-[#6750A4]" />
            {missingForFree > 0 ? (
              <>
                Te faltan <strong>{missingForFree.toFixed(2)}€</strong> para el <strong>envío gratis</strong>
              </>
            ) : (
              <span className="text-[#1E7E34] font-medium">¡Tienes envío estándar gratis! 🎉</span>
            )}
          </p>
          <div className="h-2 bg-[#E8DEF8] rounded-full overflow-hidden">
            <div className="h-full bg-[#6750A4] rounded-full transition-all" style={{ width: `${freeProgress}%` }} />
          </div>
        </div>

        {lines.map((line) => {
          const atMax = !!line.product && line.quantity >= line.product.stock
          return (
            <div key={line.id} className="bg-[#FFFBFE] rounded-3xl p-3 flex items-center gap-3 shadow-md">
              <img
                src={line.product?.image_url || "/placeholder.svg"}
                alt={line.product?.name || ""}
                className="w-20 h-20 rounded-2xl object-cover bg-white flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-sm text-[#1C1B1F] line-clamp-2">{line.product?.name}</h3>
                <p className="font-bold text-[#6750A4] mt-1">{((line.product?.price || 0) * line.quantity).toFixed(2)}€</p>
                {atMax && <p className="text-[11px] text-[#C5221F] mt-0.5">Máx. disponible: {line.product?.stock}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-full p-0.5">
                    <button onClick={() => updateQty(line, -1)} className="w-7 h-7 rounded-full bg-[#E8DEF8] flex items-center justify-center">
                      <Minus className="w-3.5 h-3.5 text-[#6750A4]" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                    <button onClick={() => updateQty(line, 1)} disabled={atMax} className="w-7 h-7 rounded-full bg-[#E8DEF8] flex items-center justify-center disabled:opacity-40">
                      <Plus className="w-3.5 h-3.5 text-[#6750A4]" />
                    </button>
                  </div>
                  <button onClick={() => moveToFavorites(line)} title="Guardar para después" className="w-8 h-8 rounded-full bg-[#E8DEF8] flex items-center justify-center ml-auto">
                    <Heart className="w-4 h-4 text-[#6750A4]" />
                  </button>
                  <button onClick={() => removeLine(line.id)} className="w-8 h-8 rounded-full bg-[#FDECEA] flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-[#C5221F]" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Resumen + continuar */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-[#FFFBFE] shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-[1998]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[#49454F]">Subtotal</span>
          <span className="text-xl font-bold text-[#1C1B1F]">{subtotal.toFixed(2)}€</span>
        </div>
        <Button
          onClick={() => router.push("/tienda/checkout")}
          className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold"
        >
          Continuar al pago
        </Button>
      </div>
    </div>
  )
}
