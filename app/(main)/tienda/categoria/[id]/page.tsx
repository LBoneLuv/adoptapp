"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ShopCartButton } from "@/components/shop-cart-button"
import { ProductCard, type ProductCardData } from "@/components/product-card"

export default function CategoriaPage() {
  const params = useParams()
  const id = params?.id as string
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      const [{ data: cat }, { data: prods }] = await Promise.all([
        supabase.from("shop_categories").select("name").eq("id", id).maybeSingle(),
        supabase
          .from("shop_products")
          .select("id, name, price, compare_at_price, image_url, stock, is_new, rating")
          .eq("category_id", id)
          .order("name"),
      ])
      if (cat) setCategoryName(cat.name)
      setProducts((prods as ProductCardData[]) || [])
      setLoading(false)
    }
    load()
  }, [id])

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <ShopCartButton />
      {categoryName && (
        <div className="px-4 pt-4">
          <h2 className="font-bold text-[#1C1B1F] text-lg">{categoryName}</h2>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg h-[260px] animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-[#79747E] py-12">No hay productos en esta categoría.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
