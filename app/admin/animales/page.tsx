"use client"

import { Pencil, Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { AdminBottomNavigation } from "@/components/admin-bottom-navigation"

interface Animal {
  id: string
  name: string
  status: string
  images: string[]
}

export default function GestionarAnimalesPage() {
  const { toast } = useToast()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const toastData = sessionStorage.getItem("animalToast")
    if (toastData) {
      const { title, description, type } = JSON.parse(toastData)
      toast({
        title,
        description,
        variant: type === "error" ? "destructive" : "default",
        duration: 3000,
      })
      sessionStorage.removeItem("animalToast")
    }

    // Fetch animals
    fetch("/api/shelter/animals")
      .then((res) => res.json())
      .then((data) => {
        setAnimals(data)
        setLoading(false)
      })
      .catch((err) => {
        console.error(err)
        setLoading(false)
      })
  }, [toast])

  const handleDelete = async (animalId: string) => {
    if (!confirm("¿Estás seguro de eliminar este animal?")) return

    try {
      const response = await fetch(`/api/animals?id=${animalId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Error al eliminar el animal")

      toast({
        title: "¡Animal eliminado!",
        description: "El animal se ha eliminado correctamente.",
        duration: 3000,
      })

      setAnimals(animals.filter((a) => a.id !== animalId))
    } catch (err) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el animal.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  return (
    <div className="flex flex-col h-screen bg-[#FEF7FF]">
      {/* Header */}
      <header className="px-4 py-6 bg-[#FFFBFE] shadow-sm">
        <h1 className="font-bold text-[#1C1B1F] mb-4 text-base">Gestionar Animales</h1>

        {/* Add New Animal Button */}
        <Link href="/admin/animales/nuevo">
          <Button className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full font-semibold shadow-md text-base h-11">
            <Plus className="w-5 h-5 mr-2" />
            Añadir Nuevo Animal
          </Button>
        </Link>
      </header>

      {/* Animal List */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#49454F] text-base">Cargando animales...</p>
          </div>
        ) : animals.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#49454F] text-base">No tienes animales registrados aún.</p>
            <p className="text-[#79747E] text-sm mt-2">Añade tu primer animal usando el botón de arriba.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {animals.map((animal) => (
              <div
                key={animal.id}
                className="bg-[#FFFBFE] rounded-3xl shadow-md p-3 flex items-center gap-3 hover:shadow-lg transition-shadow"
              >
                {/* Thumbnail */}
                <img
                  src={
                    (animal.images && animal.images.length > 0 ? animal.images[0] : null) ||
                    "/placeholder.svg?height=64&width=64"
                  }
                  alt={animal.name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />

                {/* Animal Info */}
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1C1B1F] text-base">{animal.name}</h3>
                  <span
                    className={`inline-block text-xs px-3 py-1 rounded-full mt-1 ${
                      animal.status === "available" ? "bg-[#E8DEF8] text-[#6750A4]" : "bg-[#D0BCFF] text-[#381E72]"
                    }`}
                  >
                    {animal.status === "available" ? "En adopción" : "Adoptado"}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link href={`/admin/animales/editar/${animal.id}`}>
                    <button className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF] transition-colors">
                      <Pencil className="w-4 h-4 text-[#6750A4]" />
                    </button>
                  </Link>
                  <button
                    onClick={() => handleDelete(animal.id)}
                    className="w-10 h-10 bg-[#F2E7F5] rounded-full flex items-center justify-center hover:bg-[#E8DEF8] transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-[#79747E]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Admin Bottom Navigation */}
      <AdminBottomNavigation />
    </div>
  )
}
