"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { FileText, Syringe, Shield, Cpu, Pencil, Trash2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const SPECIES_EMOJI: Record<string, string> = {
  perro: "🐕",
  gato: "🐈",
  conejo: "🐇",
  hamster: "🐹",
  ave: "🐦",
  otro: "🐾",
}

function calculateAge(birthDate: string): string {
  const today = new Date()
  const birth = new Date(birthDate)
  let years = today.getFullYear() - birth.getFullYear()
  let months = today.getMonth() - birth.getMonth()
  if (months < 0) {
    years -= 1
    months += 12
  }
  if (years <= 0) {
    return `${months} ${months === 1 ? "mes" : "meses"}`
  }
  return `${years} ${years === 1 ? "año" : "años"}`
}

export default function DetalleMascotaPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter()
  const [pet, setPet] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [petId, setPetId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      if (resolved?.id) setPetId(resolved.id)
    })
  }, [params])

  useEffect(() => {
    if (petId) loadPetDetails(petId)
  }, [petId])

  const loadPetDetails = async (id: string) => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.from("user_pets").select("*").eq("id", id).single()
      if (error) throw error
      setPet(data)
    } catch (error) {
      console.error("[v0] Error loading pet:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!pet) return
    if (!confirm(`¿Eliminar a ${pet.name}? Se borrará también su documentación.`)) return
    setDeleting(true)
    const supabase = createClient()
    const { error } = await supabase.from("user_pets").delete().eq("id", pet.id)
    if (error) {
      alert("Error al eliminar")
      setDeleting(false)
      return
    }
    router.push("/mis-animales")
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
      {/* Tarjeta principal */}
      <div className="bg-white rounded-3xl shadow-md p-4 mb-4 flex gap-4">
        <img
          src={pet.photo_url || "/placeholder.svg?height=120&width=120"}
          alt={pet.name}
          className="w-28 h-28 rounded-2xl object-cover bg-[#E8DEF8] flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-[#1C1B1F]">{pet.name}</h2>
            {pet.gender === "macho" && <span className="text-[#2196F3] text-lg font-bold leading-none">♂</span>}
            {pet.gender === "hembra" && <span className="text-[#E91E63] text-lg font-bold leading-none">♀</span>}
          </div>
          <p className="text-sm text-[#49454F] mb-1 flex items-center gap-1">
            <span>{SPECIES_EMOJI[pet.species] || "🐾"}</span>
            {pet.breed || pet.species}
          </p>
          {pet.birth_date && <p className="text-sm text-[#79747E]">{calculateAge(pet.birth_date)}</p>}
          {pet.microchip && <p className="text-xs text-[#79747E] mt-1">Chip: {pet.microchip}</p>}
        </div>
      </div>

      {/* Acciones */}
      <div className="flex gap-3 mb-6">
        <Link
          href={`/mis-animales/${pet.id}/editar`}
          className="flex-1 flex items-center justify-center gap-2 bg-[#E8DEF8] text-[#6750A4] rounded-full h-11 font-semibold text-sm hover:bg-[#D0BCFF] transition-colors"
        >
          <Pencil className="w-4 h-4" /> Editar
        </Link>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex-1 flex items-center justify-center gap-2 bg-[#FDECEA] text-[#C5221F] rounded-full h-11 font-semibold text-sm hover:bg-[#f8d7d4] transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-4 h-4" /> {deleting ? "Eliminando..." : "Eliminar"}
        </button>
      </div>

      {/* Notas */}
      {pet.notes && (
        <div className="bg-white rounded-3xl shadow-md p-4 mb-6">
          <h4 className="text-sm font-bold text-[#1C1B1F] mb-1">Notas</h4>
          <p className="text-sm text-[#49454F] whitespace-pre-wrap">{pet.notes}</p>
        </div>
      )}

      <h3 className="text-lg font-bold text-[#1C1B1F] mb-4">Documentación</h3>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href={`/mis-animales/${pet.id}/microchip`}>
          <div className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#E8DEF8] rounded-full flex items-center justify-center mb-3">
              <Cpu className="w-6 h-6 text-[#6750A4]" />
            </div>
            <h4 className="text-sm font-bold text-[#1C1B1F] mb-1">Microchip</h4>
            <p className="text-xs text-[#79747E]">Información de identificación</p>
          </div>
        </Link>

        <Link href={`/mis-animales/${pet.id}/cartilla`}>
          <div className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#E8DEF8] rounded-full flex items-center justify-center mb-3">
              <FileText className="w-6 h-6 text-[#6750A4]" />
            </div>
            <h4 className="text-sm font-bold text-[#1C1B1F] mb-1">Cartilla</h4>
            <p className="text-xs text-[#79747E]">Pasaporte veterinario</p>
          </div>
        </Link>

        <Link href={`/mis-animales/${pet.id}/vacunacion`}>
          <div className="bg-white rounded-3xl shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-[#E8DEF8] rounded-full flex items-center justify-center mb-3">
              <Syringe className="w-6 h-6 text-[#6750A4]" />
            </div>
            <h4 className="text-sm font-bold text-[#1C1B1F] mb-1">Vacunación</h4>
            <p className="text-xs text-[#79747E]">Calendario de vacunas</p>
          </div>
        </Link>

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
