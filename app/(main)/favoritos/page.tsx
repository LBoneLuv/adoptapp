"use client"

import { useEffect, useState } from "react"
import { PetCard } from "@/components/pet-card"
import { createClient } from "@/lib/supabase/client"
import { Heart } from "lucide-react"

export default function FavoritosPage() {
  const [favorites, setFavorites] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase
        .from("favorites")
        .select(
          `
          animal_id,
          animals (
            id,
            name,
            species,
            breed,
            age,
            size,
            gender,
            description,
            location,
            images,
            shelter_id,
            created_at,
            shelters (
              name,
              profile_image_url
            )
          )
        `,
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error

      const favoritePets = data?.map((fav) => fav.animals).filter(Boolean) || []
      setFavorites(favoritePets)
    } catch (error) {
      console.error("Error loading favorites:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
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
        ) : favorites.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {favorites.map((animal: any) => (
              <PetCard key={animal.id} pet={animal} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="bg-[#E8DEF8] rounded-full p-6 mb-4">
              <Heart className="w-12 h-12 text-[#6750A4]" />
            </div>
            <h2 className="text-xl font-bold text-[#1C1B1F] mb-2">No tienes favoritos aún</h2>
            <p className="text-[#49454F] mb-6">Marca animales como favoritos para verlos aquí</p>
          </div>
        )}
      </div>
    </div>
  )
}
