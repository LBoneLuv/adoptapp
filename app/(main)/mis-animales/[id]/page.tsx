"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, Syringe, Shield, Cpu } from "lucide-react"
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

export default function DetalleMascotaPage({ params }: { params: { id: string } }) {
  const [pet, setPet] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (params?.id) {
      loadPetDetails(params.id)
    }
  }, [params?.id])

  const loadPetDetails = async (petId: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("user_pets").select("*").eq("id", petId).single()

      if (error) throw error
      setPet(data)
    } catch (error) {
      console.error("Error loading pet:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#FEF7FF]">
        <p className="text-[#49454F]">Cargando...</p>
      </div>
    )
  }

  if (!pet) {
    return (
      <div className="flex items-center justify-center py-20 bg-[#FEF7FF]">
        <p className="text-[#49454F]">No se encontró la mascota</p>
      </div>
    )
  }

  return (
    <div className="bg-[#FEF7FF] px-4 py-6 pb-24">
      <div className="bg-white rounded-3xl shadow-md p-4 mb-6 flex gap-4">
        <img
          src={pet.photo_url || "/placeholder.svg?height=120&width=120"}
          alt={pet.name}
          className="w-28 h-28 rounded-2xl object-cover"
        />

        <div className="flex-1">
          <h2 className="text-xl font-bold text-[#1C1B1F] mb-1">{pet.name}</h2>
          <p className="text-sm text-[#49454F] mb-1">{pet.breed || pet.species}</p>
          {pet.birth_date && <p className="text-sm text-[#79747E]">{calculateAge(pet.birth_date)}</p>}
        </div>
      </div>

      <h3 className="text-lg font-bold text-[#1C1B1F] mb-4">Documentación</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Card Microchip */}
        <Link href={`/mis-animales/${pet.id}/microchip`}>
          <div className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#E8DEF8] rounded-full flex items-center justify-center mb-3">
              <Cpu className="w-6 h-6 text-[#6750A4]" />
            </div>
            <h4 className="text-sm font-bold text-[#1C1B1F] mb-1">Microchip</h4>
            <p className="text-xs text-[#79747E]">Información de identificación</p>
          </div>
        </Link>

        {/* Card Cartilla */}
        <Link href={`/mis-animales/${pet.id}/cartilla`}>
          <div className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#E8DEF8] rounded-full flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-[#6750A4]" />
            </div>
            <h4 className="text-sm font-bold text-[#1C1B1F] mb-1">Cartilla</h4>
            <p className="text-xs text-[#79747E]">Pasaporte veterinario de tu animal </p>
          </div>
        </Link>

        {/* Card Vacunación */}
        <Link href={`/mis-animales/${pet.id}/vacunacion`}>
          <div className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#E8DEF8] rounded-full flex items-center justify-center mb-3">
              <Syringe className="w-6 h-6 text-[#6750A4]" />
            </div>
            <h4 className="text-sm font-bold text-[#1C1B1F] mb-1">Vacunación</h4>
            <p className="text-xs text-[#79747E]">Calendario de vacunas</p>
          </div>
        </Link>

        {/* Card Seguro */}
        <Link href={`/mis-animales/${pet.id}/seguro`}>
          <div className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#E8DEF8] rounded-full flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-[#6750A4]" />
            </div>
            <h4 className="text-sm font-bold text-[#1C1B1F] mb-1">Seguro</h4>
            <p className="text-xs text-[#79747E]">Detalles de tu póliza y siniestros</p>
          </div>
        </Link>
      </div>
    </div>
  )
}
