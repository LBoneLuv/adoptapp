"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"
import { ShopCartButton } from "@/components/shop-cart-button"

interface Product {
  id: string
  name: string
  price: number
  image_url: string | null
}

export default function CategoriaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [products, setProducts] = useState<Product[]>([])
  const [categoryName, setCategoryName] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    async function load() {
      const [{ data: cat }, { data: prods }] = await Promise.all([
        supabase.from("shop_categories").select("name").eq("id", id).maybeSingle(),
        supabase.from("shop_products").select("id, name, price, image_url").eq("category_id", id).order("name"),
      ])
      if (cat) setCategoryName(cat.name)
      setProducts(prods || [])
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
              <Link key={product.id} href={`/tienda/producto/${product.id}`}>
                <Card className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow h-[260px] flex flex-col">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-40 object-cover mt-[-25px]"
                  />
                  <div className="p-3 flex-1 flex flex-col mt-[-20px]">
                    <h3 className="font-medium text-sm mb-1 line-clamp-2 overflow-hidden text-ellipsis">
                      {product.name}
                    </h3>
                    <p className="font-bold text-[#6750A4] mt-auto text-base">{product.price.toFixed(2)}€</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
