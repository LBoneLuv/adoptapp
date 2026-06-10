"use client"

import { Pencil, Trash2, Plus, Eye, Settings, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"
import { AdminBottomNavigation } from "@/components/admin-bottom-navigation"

interface Animal {
  id: string
  name: string
  status: string
  images: string[]
}

type Filter = "all" | "available" | "adopted"

export default function GestionarAnimalesPage() {
  const { toast } = useToast()
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>("all")
  const [shelterId, setShelterId] = useState<string | null>(null)
  const [donations, setDonations] = useState(0)

  useEffect(() => {
    const toastData = sessionStorage.getItem("animalToast")
    if (toastData) {
      const { title, description, type } = JSON.parse(toastData)
      toast({ title, description, variant: type === "error" ? "destructive" : "default", duration: 3000 })
      sessionStorage.removeItem("animalToast")
    }

    fetch("/api/shelter/animals")
      .then((res) => res.json())
      .then((data) => {
        setAnimals(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => setLoading(false))

    // Datos de la protectora (id + donaciones recibidas)
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      setShelterId(user.id)
      const { data } = await supabase.from("donations").select("amount").eq("shelter_id", user.id).eq("status", "paid")
      setDonations((data || []).reduce((s, d) => s + Number(d.amount || 0), 0))
    })
  }, [toast])

  const handleDelete = async (animalId: string) => {
    if (!confirm("¿Estás seguro de eliminar este animal?")) return
    try {
      const response = await fetch(`/api/animals?id=${animalId}`, { method: "DELETE" })
      if (!response.ok) throw new Error("Error al eliminar el animal")
      toast({ title: "¡Animal eliminado!", description: "Se ha eliminado correctamente.", duration: 3000 })
      setAnimals(animals.filter((a) => a.id !== animalId))
    } catch {
      toast({ title: "Error", description: "No se pudo eliminar el animal.", variant: "destructive", duration: 3000 })
    }
  }

  const total = animals.length
  const available = animals.filter((a) => a.status === "available").length
  const adopted = total - available
  const filtered =
    filter === "all" ? animals : filter === "available" ? animals.filter((a) => a.status === "available") : animals.filter((a) => a.status !== "available")

  return (
    <div className="flex flex-col h-screen bg-[#FEF7FF]">
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Stats */}
        <div className="px-4 pt-5">
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Animales", value: total },
              { label: "En adopción", value: available },
              { label: "Adoptados", value: adopted },
            ].map((s) => (
              <div key={s.label} className="bg-[#FFFBFE] rounded-3xl shadow-md p-3 text-center">
                <p className="text-2xl font-bold text-[#6750A4]">{s.value}</p>
                <p className="text-[11px] text-[#79747E] leading-tight">{s.label}</p>
              </div>
            ))}
          </div>

          {donations > 0 && (
            <div className="mt-3 flex items-center gap-2 bg-[#E6F4EA] text-[#1E7E34] rounded-2xl px-4 py-3 text-sm font-medium">
              <Heart className="w-4 h-4 fill-[#1E7E34] flex-shrink-0" />
              Has recibido {donations.toFixed(2)}€ en donaciones. ¡Gracias a vuestros apoyos!
            </div>
          )}

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 gap-3 mt-3">
            {shelterId && (
              <Link href={`/protectora/${shelterId}`}>
                <Button variant="outline" className="w-full border-[#6750A4] text-[#6750A4] rounded-full h-10 bg-transparent text-sm">
                  <Eye className="w-4 h-4 mr-1" /> Mi página
                </Button>
              </Link>
            )}
            <Link href="/admin/perfil">
              <Button variant="outline" className="w-full border-[#6750A4] text-[#6750A4] rounded-full h-10 bg-transparent text-sm">
                <Settings className="w-4 h-4 mr-1" /> Editar perfil
              </Button>
            </Link>
          </div>

          <Link href="/admin/animales/nuevo">
            <Button className="w-full mt-3 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full font-semibold shadow-md text-base h-11">
              <Plus className="w-5 h-5 mr-2" /> Añadir nuevo animal
            </Button>
          </Link>
        </div>

        {/* Filtro */}
        <div className="px-4 pt-4 flex gap-2 overflow-x-auto">
          {[
            { id: "all", label: `Todos (${total})` },
            { id: "available", label: `En adopción (${available})` },
            { id: "adopted", label: `Adoptados (${adopted})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as Filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${filter === f.id ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista */}
        <div className="px-4 py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-3 flex gap-3 animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-2xl" />
                  <div className="flex-1 space-y-2 py-2">
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-[#49454F] text-base">{total === 0 ? "No tienes animales registrados aún." : "No hay animales en esta vista."}</p>
              {total === 0 && <p className="text-[#79747E] text-sm mt-2">Añade tu primer animal con el botón de arriba.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((animal) => (
                <div key={animal.id} className="bg-[#FFFBFE] rounded-3xl shadow-md p-3 flex items-center gap-3 hover:shadow-lg transition-shadow">
                  <img
                    src={(animal.images && animal.images.length > 0 ? animal.images[0] : null) || "/placeholder.svg?height=64&width=64"}
                    alt={animal.name}
                    className="w-16 h-16 rounded-2xl object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-[#1C1B1F] text-base">{animal.name}</h3>
                    <span className={`inline-block text-xs px-3 py-1 rounded-full mt-1 ${animal.status === "available" ? "bg-[#E8DEF8] text-[#6750A4]" : "bg-[#D0BCFF] text-[#381E72]"}`}>
                      {animal.status === "available" ? "En adopción" : "Adoptado"}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/animales/editar/${animal.id}`}>
                      <button className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF] transition-colors">
                        <Pencil className="w-4 h-4 text-[#6750A4]" />
                      </button>
                    </Link>
                    <button onClick={() => handleDelete(animal.id)} className="w-10 h-10 bg-[#F2E7F5] rounded-full flex items-center justify-center hover:bg-[#E8DEF8] transition-colors">
                      <Trash2 className="w-4 h-4 text-[#79747E]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AdminBottomNavigation />
    </div>
  )
}
