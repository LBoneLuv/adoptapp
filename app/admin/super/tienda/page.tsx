"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Pencil, Trash2, ImageIcon } from "lucide-react"
import type { ProductRecord } from "@/components/product-form"

export default function SuperTiendaPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [products, setProducts] = useState<ProductRecord[]>([])

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
      const { data: shelter } = await supabase.from("shelters").select("role").eq("id", user.id).maybeSingle()
      if (profile?.role !== "super_admin" && shelter?.role !== "super_admin") {
        router.replace("/adopta")
        return
      }
      setAllowed(true)
      const { data } = await supabase.from("shop_products").select("*").order("created_at", { ascending: false })
      setProducts((data as ProductRecord[]) || [])
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function remove(id: string, name: string) {
    if (!confirm(`¿Eliminar "${name}"?`)) return
    const supabase = createClient()
    const { error } = await supabase.from("shop_products").delete().eq("id", id)
    if (error) {
      alert("Error al eliminar")
      return
    }
    setProducts((p) => p.filter((x) => x.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }
  if (!allowed) return null

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-24">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/super" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
          </Link>
          <h1 className="font-bold text-[#1C1B1F] text-lg">Productos</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/super/tienda/banners">
            <Button variant="outline" className="border-[#6750A4] text-[#6750A4] rounded-full h-10 bg-transparent">
              <ImageIcon className="w-4 h-4 mr-1" /> Banners
            </Button>
          </Link>
          <Link href="/admin/super/tienda/nuevo">
            <Button className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-10">
              <Plus className="w-4 h-4 mr-1" /> Añadir
            </Button>
          </Link>
        </div>
      </header>

      <div className="px-4 py-4 space-y-3">
        {products.length === 0 ? (
          <p className="text-center text-[#79747E] py-12">No hay productos todavía.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="bg-[#FFFBFE] rounded-3xl p-3 flex items-center gap-3 shadow-md">
              <img
                src={p.image_url || "/placeholder.svg?height=64&width=64"}
                alt={p.name}
                className="w-16 h-16 rounded-2xl object-cover bg-white flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#1C1B1F] text-sm line-clamp-1">{p.name}</h3>
                <p className="font-bold text-[#6750A4] text-sm">{p.price.toFixed(2)}€</p>
                <div className="flex items-center gap-2 text-xs text-[#79747E]">
                  <span>Stock: {p.stock}</span>
                  {p.featured && <span className="text-[#6750A4] font-medium">Destacado</span>}
                  {p.is_new && <span className="text-[#1E7E34] font-medium">Nuevo</span>}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Link
                  href={`/admin/super/tienda/${p.id}`}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#E8DEF8] hover:bg-[#D0BCFF]"
                >
                  <Pencil className="w-4 h-4 text-[#6750A4]" />
                </Link>
                <button
                  onClick={() => remove(p.id, p.name)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-[#FDECEA] hover:bg-[#f8d7d4]"
                >
                  <Trash2 className="w-4 h-4 text-[#C5221F]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
