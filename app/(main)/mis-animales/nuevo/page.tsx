"use client"

import type React from "react"

import { Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function NuevaMascotaPage() {
  console.log("[v0] NuevaMascotaPage: componente cargado")

  const router = useRouter()
  const { toast } = useToast()
  const [uploadedPhoto, setUploadedPhoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    species: "perro",
    breed: "",
    birth_date: "",
    gender: "macho",
  })

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      console.log("[v0] Foto seleccionada:", file.name)
      setUploadedPhoto(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const removePhoto = () => {
    setUploadedPhoto(null)
    setPreviewUrl("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      console.log("[v0] Iniciando proceso de guardado")
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      console.log("[v0] Usuario:", user?.id)

      if (!user) throw new Error("Usuario no autenticado")

      let photoUrl = ""

      if (uploadedPhoto) {
        console.log("[v0] Subiendo foto...")
        const formDataUpload = new FormData()
        formDataUpload.append("file", uploadedPhoto)

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formDataUpload,
        })

        if (!uploadResponse.ok) throw new Error("Error al subir la imagen")

        const uploadData = await uploadResponse.json()
        photoUrl = uploadData.url
        console.log("[v0] Foto subida:", photoUrl)
      }

      console.log("[v0] Guardando mascota en base de datos...")
      const { error } = await supabase.from("user_pets").insert({
        user_id: user.id,
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        birth_date: formData.birth_date || null,
        gender: formData.gender,
        photo_url: photoUrl,
      })

      if (error) {
        console.error("[v0] Error al guardar:", error)
        throw error
      }

      console.log("[v0] Mascota guardada exitosamente")

      toast({
        title: "¡Mascota añadida!",
        description: `${formData.name} se ha registrado correctamente.`,
        duration: 3000,
      })

      router.push("/mis-animales")
    } catch (error) {
      console.error("[v0] Error en handleSubmit:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la mascota. Inténtalo de nuevo.",
        variant: "destructive",
        duration: 4000,
      })
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#FEF7FF] pb-24 px-4 py-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="font-bold text-[#1C1B1F] text-xl mb-6">Añadir Mascota</h1>

        <div className="mb-6">
          <h2 className="text-base font-semibold text-[#1C1B1F] mb-3">Foto del animal</h2>

          {previewUrl ? (
            <div className="relative w-full h-64 rounded-3xl overflow-hidden shadow-md">
              <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={removePhoto}
                className="absolute top-3 right-3 w-10 h-10 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          ) : (
            <label className="block bg-[#FFFBFE] rounded-3xl shadow-md p-12 cursor-pointer hover:shadow-lg transition-shadow">
              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <div className="flex flex-col items-center gap-3">
                <div className="w-20 h-20 bg-[#E8DEF8] rounded-full flex items-center justify-center">
                  <Camera className="w-10 h-10 text-[#6750A4]" />
                </div>
                <p className="text-sm text-[#49454F] text-center font-medium">Toca para subir una foto</p>
              </div>
            </label>
          )}
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Nombre *</label>
            <input
              type="text"
              required
              placeholder="Ej: Luna"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Tipo de animal *</label>
            <select
              required
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            >
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
              <option value="conejo">Conejo</option>
              <option value="hamster">Hámster</option>
              <option value="ave">Ave</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Fecha de nacimiento</label>
            <input
              type="date"
              value={formData.birth_date}
              onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Raza</label>
            <input
              type="text"
              placeholder="Ej: Golden Retriever"
              value={formData.breed}
              onChange={(e) => setFormData({ ...formData, breed: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Género *</label>
            <select
              required
              value={formData.gender}
              onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            >
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full text-base font-semibold shadow-md h-12 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Animal"}
        </Button>
      </form>
    </div>
  )
}
