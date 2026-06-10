"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Minus, Plus, ShoppingCart, Check } from "lucide-react"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  image_url: string | null
  stock: number
  category_id: string | null
}

export default function ProductoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [categoryName, setCategoryName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      const { data } = await supabase.from("shop_products").select("*").eq("id", id).single()
      if (data) {
        setProduct(data)
        if (data.category_id) {
          const { data: cat } = await supabase
            .from("shop_categories")
            .select("name")
            .eq("id", data.category_id)
            .maybeSingle()
          if (cat) setCategoryName(cat.name)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function addToCart() {
    if (!product) return
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

    let error
    if (existing) {
      ;({ error } = await supabase
        .from("cart_items")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id))
    } else {
      ;({ error } = await supabase
        .from("cart_items")
        .insert({ user_id: user.id, product_id: product.id, quantity }))
    }

    setAdding(false)
    if (!error) {
      setAdded(true)
      setTimeout(() => setAdded(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7FF]">
        <p className="text-[#49454F] mb-4">No se encontró el producto</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  const outOfStock = product.stock <= 0

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-28">
      <div className="relative">
        <img
          src={product.image_url || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-72 object-cover bg-white"
        />
      </div>

      <div className="px-4 py-5">
        {categoryName && (
          <span className="text-xs font-semibold text-[#6750A4] bg-[#E8DEF8] px-3 py-1 rounded-full">
            {categoryName}
          </span>
        )}
        <h1 className="text-2xl font-bold text-[#1C1B1F] mt-3">{product.name}</h1>
        <p className="text-2xl font-bold text-[#6750A4] mt-1">{product.price.toFixed(2)}€</p>

        <p className={`text-sm mt-2 ${outOfStock ? "text-[#C5221F]" : "text-[#1E7E34]"}`}>
          {outOfStock ? "Agotado" : `${product.stock} disponibles`}
        </p>

        {product.description && (
          <div className="mt-5">
            <h2 className="text-lg font-semibold text-[#1C1B1F] mb-2">Descripción</h2>
            <div
              className="text-[#49454F] text-sm leading-relaxed [&_p]:mb-2"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Quantity selector */}
        {!outOfStock && (
          <div className="flex items-center gap-4 mt-6">
            <span className="text-sm font-medium text-[#49454F]">Cantidad</span>
            <div className="flex items-center gap-3 bg-[#FFFBFE] rounded-full shadow-sm p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-9 h-9 rounded-full bg-[#E8DEF8] flex items-center justify-center"
              >
                <Minus className="w-4 h-4 text-[#6750A4]" />
              </button>
              <span className="w-6 text-center font-semibold text-[#1C1B1F]">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                className="w-9 h-9 rounded-full bg-[#E8DEF8] flex items-center justify-center"
              >
                <Plus className="w-4 h-4 text-[#6750A4]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add to cart bar */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-[#FFFBFE] shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-[1998]">
        <Button
          onClick={addToCart}
          disabled={adding || outOfStock}
          className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold disabled:opacity-50"
        >
          {added ? (
            <>
              <Check className="w-5 h-5 mr-2" /> Añadido al carrito
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              {outOfStock ? "Agotado" : `Añadir · ${(product.price * quantity).toFixed(2)}€`}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
