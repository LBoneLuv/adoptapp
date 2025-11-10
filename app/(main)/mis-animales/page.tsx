"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function MisAnimalesPage() {
  const [myPets, setMyPets] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadMyPets()
  }, [])

  const loadMyPets = async () => {
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
        .from("user_pets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) throw error
      setMyPets(data || [])
    } catch (error) {
      console.error("Error loading pets:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-40 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : myPets.length > 0 ? (
          <div className="space-y-4">
            {myPets.map((pet: any) => (
              <div key={pet.id} className="bg-white rounded-2xl overflow-hidden shadow-md">
                {pet.photo_url && (
                  <img src={pet.photo_url || "/placeholder.svg"} alt={pet.name} className="w-full h-48 object-cover" />
                )}
                <div className="p-4">
                  <h3 className="text-lg font-bold text-[#1C1B1F] mb-1">{pet.name}</h3>
                  <p className="text-sm text-[#49454F] mb-2">
                    {pet.species} • {pet.breed}
                  </p>
                  {pet.microchip && <p className="text-xs text-[#79747E]">Microchip: {pet.microchip}</p>}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="bg-[#E8DEF8] rounded-full p-6 mb-4">
              <Heart className="w-12 h-12 text-[#6750A4]" />
            </div>
            <h2 className="text-xl font-bold text-[#1C1B1F] mb-2">No tienes mascotas registradas</h2>
            <p className="text-[#49454F] mb-6">Añade tus mascotas para gestionar su información</p>
            <Button className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full">
              <Plus className="w-5 h-5 mr-2" />
              Añadir mascota
            </Button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {myPets.length > 0 && (
        <button className="fixed bottom-24 right-6 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-colors z-50">
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  )
}
