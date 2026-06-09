"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ProductForm, type ProductRecord } from "@/components/product-form"

export default function EditarProductoPage() {
  const params = useParams()
  const id = params?.id as string
  const [product, setProduct] = useState<ProductRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from("shop_products")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProduct(data as ProductRecord)
        setLoading(false)
      })
  }, [id])

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <Link href="/admin/super/tienda" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF]">
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-base line-clamp-1">
          {product ? `Editar: ${product.name}` : "Editar producto"}
        </h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6750A4]" />
          </div>
        ) : product ? (
          <ProductForm initial={product} />
        ) : (
          <p className="text-center text-[#79747E] py-12">No se encontró el producto.</p>
        )}
      </div>
    </div>
  )
}
