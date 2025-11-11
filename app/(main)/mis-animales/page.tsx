"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function calculateAge(birthDate: string): string {
  const today = new Date()
  const birth = new Date(birthDate)
  const years = today.getFullYear() - birth.getFullYear()
  const months = today.getMonth() - birth.getMonth()

  if (years === 0) {
    return `${months} ${months === 1 ? "mes" : "meses"}`
  } else if (months < 0) {
    return `${years - 1} ${years - 1 === 1 ? "año" : "años"}`
  }
  return `${years} ${years === 1 ? "año" : "años"}`
}

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
        <div className="flex items-center justify-between mb-6">
          
          <Link href="/mis-animales/nuevo">
            <Button className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-10 px-4">
              <Plus className="w-5 h-5 mr-1" />
              Añadir
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-3xl p-3 flex items-center gap-3 animate-pulse">
                <div className="w-20 h-20 bg-gray-200 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : myPets.length > 0 ? (
          <div className="space-y-3">
            {myPets.map((pet: any) => (
              <Link key={pet.id} href={`/mis-animales/${pet.id}`} className="block">
                <div className="bg-white rounded-3xl p-3 flex items-center gap-3 shadow-md hover:shadow-lg transition-shadow cursor-pointer active:scale-[0.98]">
                  {/* Foto a la izquierda */}
                  <img
                    src={pet.photo_url || "/placeholder.svg?height=80&width=80"}
                    alt={pet.name}
                    className="w-20 h-20 rounded-2xl object-cover"
                  />

                  {/* Información a la derecha */}
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#1C1B1F] mb-1">{pet.name}</h3>
                    <p className="text-sm text-[#49454F]">{pet.breed || pet.species}</p>
                    {pet.birth_date && <p className="text-xs text-[#79747E] mt-1">{calculateAge(pet.birth_date)}</p>}
                  </div>

                  {/* Flecha para indicar que es clicable */}
                  <ArrowRight className="w-5 h-5 text-[#79747E]" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
            <div className="bg-[#E8DEF8] rounded-full p-8 mb-6">
              <Plus className="w-16 h-16 text-[#6750A4]" />
            </div>
            <h2 className="text-2xl font-bold text-[#1C1B1F] mb-3">No tienes mascotas registradas</h2>
            <p className="text-[#49454F] mb-6 max-w-sm">
              Añade tus mascotas para gestionar su documentación, vacunas, seguros y más
            </p>
            <Link href="/mis-animales/nuevo">
              <Button className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 px-8">
                <Plus className="w-5 h-5 mr-2" />
                Añadir mi primera mascota
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
