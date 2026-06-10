"use client"

import { useEffect, useState } from "react"
import { PetCard } from "@/components/pet-card"
import { ProductCard, type ProductCardData } from "@/components/product-card"
import { createClient } from "@/lib/supabase/client"
import { Heart } from "lucide-react"

export default function FavoritosPage() {
  const [tab, setTab] = useState<"mascotas" | "productos">("mascotas")
  const [pets, setPets] = useState<any[]>([])
  const [products, setProducts] = useState<ProductCardData[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          setIsLoading(false)
          return
        }

        const [petsRes, prodsRes] = await Promise.all([
          supabase
            .from("favorites")
            .select(
              `animal_id, animals ( id, name, species, breed, age, size, gender, description, location, images, shelter_id, created_at, shelters ( name, profile_image_url ) )`,
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
          supabase
            .from("product_favorites")
            .select(
              `product:shop_products ( id, name, price, compare_at_price, image_url, stock, is_new, rating )`,
            )
            .eq("user_id", user.id)
            .order("created_at", { ascending: false }),
        ])

        setPets((petsRes.data?.map((f: any) => f.animals).filter(Boolean) as any[]) || [])
        setProducts((prodsRes.data?.map((f: any) => f.product).filter(Boolean) as ProductCardData[]) || [])
      } catch (error) {
        console.error("Error loading favorites:", error)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      {/* Tabs */}
      <div className="px-4 pt-3 pb-2 bg-[#FFFBFE] shadow-sm">
        <div className="flex bg-[#E8DEF8] rounded-full p-1">
          {(
            [
              { id: "mascotas", label: `Mascotas${pets.length ? ` (${pets.length})` : ""}` },
              { id: "productos", label: `Productos${products.length ? ` (${products.length})` : ""}` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold transition-all ${
                tab === t.id ? "bg-[#6750A4] text-white shadow" : "text-[#6750A4]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-40 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === "mascotas" ? (
          pets.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {pets.map((animal: any) => (
                <PetCard key={animal.id} pet={animal} />
              ))}
            </div>
          ) : (
            <EmptyState text="Marca animales como favoritos para verlos aquí" />
          )
        ) : products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <EmptyState text="Guarda productos con el corazón para verlos aquí" />
        )}
      </div>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center px-6 py-16">
      <div className="bg-[#E8DEF8] rounded-full p-6 mb-4">
        <Heart className="w-12 h-12 text-[#6750A4]" />
      </div>
      <h2 className="text-xl font-bold text-[#1C1B1F] mb-2">No tienes favoritos aún</h2>
      <p className="text-[#49454F]">{text}</p>
    </div>
  )
}
