"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ShoppingCart, Check, Star } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export interface ProductCardData {
  id: string
  name: string
  price: number
  compare_at_price?: number | null
  image_url?: string | null
  stock?: number | null
  is_new?: boolean | null
  rating?: number | null
}

export function ProductCard({ product }: { product: ProductCardData }) {
  const router = useRouter()
  const [added, setAdded] = useState(false)
  const [adding, setAdding] = useState(false)

  const outOfStock = (product.stock ?? 1) <= 0
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price
  const discount = onSale ? Math.round((1 - product.price / (product.compare_at_price as number)) * 100) : 0

  async function quickAdd(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (outOfStock || adding) return
    setAdding(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle()
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + 1 }).eq("id", existing.id)
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity: 1 })
    }
    setAdding(false)
    setAdded(true)
    setTimeout(() => setAdded(false), 1500)
    window.dispatchEvent(new Event("cart-updated"))
  }

  return (
    <Link href={`/tienda/producto/${product.id}`}>
      <div className="bg-[#FFFBFE] rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
        <div className="relative">
          <img
            src={product.image_url || "/placeholder.svg"}
            alt={product.name}
            className="w-full h-36 object-cover"
            loading="lazy"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {onSale && (
              <span className="bg-[#D32F2F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">-{discount}%</span>
            )}
            {product.is_new && !onSale && (
              <span className="bg-[#1E7E34] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Nuevo</span>
            )}
          </div>
          {outOfStock && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
              <span className="bg-[#1C1B1F]/80 text-white text-xs font-semibold px-3 py-1 rounded-full">Agotado</span>
            </div>
          )}
          {/* Quick add */}
          {!outOfStock && (
            <button
              onClick={quickAdd}
              className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#6750A4] hover:bg-[#7965AF] flex items-center justify-center shadow-lg"
              aria-label="Añadir al carrito"
            >
              {added ? <Check className="w-4 h-4 text-white" /> : <ShoppingCart className="w-4 h-4 text-white" />}
            </button>
          )}
        </div>

        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-medium text-sm text-[#1C1B1F] line-clamp-2 leading-tight">{product.name}</h3>
          {product.rating != null && (
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3 h-3 fill-[#FFC107] text-[#FFC107]" />
              <span className="text-xs text-[#49454F]">{product.rating.toFixed(1)}</span>
            </div>
          )}
          <div className="mt-auto pt-2 flex items-baseline gap-2">
            <span className="font-bold text-[#6750A4] text-base">{product.price.toFixed(2)}€</span>
            {onSale && (
              <span className="text-xs text-[#79747E] line-through">
                {(product.compare_at_price as number).toFixed(2)}€
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
