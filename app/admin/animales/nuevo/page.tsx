"use client"

import type React from "react"

import { ArrowLeft, Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { LocationAutocomplete } from "@/components/location-autocomplete"
import { BreedAutocomplete } from "@/components/breed-autocomplete"

export default function NuevoAnimalPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    name: "",
    species: "perro",
    breed: "",
    age: "",
    size: "mediano",
    gender: "macho",
    description: "",
    location: "",
    vaccinated: false,
    microchipped: false,
    sterilized: false,
  })

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      const newFiles = Array.from(files)
      const newPreviews = newFiles.map((file) => URL.createObjectURL(file))
      setUploadedPhotos([...uploadedPhotos, ...newFiles])
      setPreviewUrls([...previewUrls, ...newPreviews])
    }
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos(uploadedPhotos.filter((_, i) => i !== index))
    setPreviewUrls(previewUrls.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("[v0] Starting to save new animal")

    try {
      const imageUrls: string[] = []

      for (const photo of uploadedPhotos) {
        const formData = new FormData()
        formData.append("file", photo)

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!uploadRes.ok) throw new Error("Error al subir la imagen")

        const { url } = await uploadRes.json()
        imageUrls.push(url)
      }

      console.log("[v0] Images uploaded:", imageUrls)

      const response = await fetch("/api/animals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          images: imageUrls,
        }),
      })

      if (!response.ok) throw new Error("Error al crear el animal")

      console.log("[v0] Animal created successfully")

      const toastEl = document.createElement("div")
      toastEl.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #4CAF50;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        animation: slideUp 0.3s ease-out;
      `
      toastEl.textContent = "✓ Animal creado correctamente"
      document.body.appendChild(toastEl)

      setTimeout(() => {
        window.location.href = "/admin/animales"
      }, 1500)
    } catch (err) {
      console.error(err)
      const errorMessage = err instanceof Error ? err.message : "Error al guardar el animal"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 4000,
      })
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      {/* Header */}
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm flex items-center gap-3">
        <Link
          href="/admin/animales"
          className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-base">Añadir Nuevo Animal</h1>
      </header>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-2xl text-sm">{error}</div>
        )}

        {/* Photo Upload Section */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[#1C1B1F] mb-3">Subir Fotos</h2>
          <label className="block bg-[#FFFBFE] rounded-3xl shadow-md p-8 cursor-pointer hover:shadow-lg transition-shadow">
            <input type="file" multiple accept="image/*" onChange={handlePhotoUpload} className="hidden" />
            <div className="flex flex-col items-center gap-3">
              <div className="w-16 h-16 bg-[#E8DEF8] rounded-full flex items-center justify-center">
                <Camera className="w-8 h-8 text-[#6750A4]" />
              </div>
              <p className="text-sm text-[#49454F] text-center">Toca para subir fotos</p>
            </div>
          </label>

          {/* Photo Thumbnails */}
          {previewUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-3 mt-4">
              {previewUrls.map((photo, index) => (
                <div key={index} className="relative">
                  <img
                    src={photo || "/placeholder.svg"}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-24 object-cover rounded-2xl"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-[#6750A4] rounded-full flex items-center justify-center shadow-md"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Nombre del animal *</label>
            <input
              type="text"
              required
              placeholder="Ej: Buddy"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Especie *</label>
            <select
              required
              value={formData.species}
              onChange={(e) => setFormData({ ...formData, species: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            >
              <option value="perro">Perro</option>
              <option value="gato">Gato</option>
              <option value="otro">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Edad *</label>
            <input
              type="text"
              required
              placeholder="Ej: 2 años"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Raza</label>
            <BreedAutocomplete
              value={formData.breed}
              onChange={(breed) => setFormData({ ...formData, breed })}
              species={formData.species}
              placeholder="Ej: Golden Retriever"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Tamaño *</label>
            <select
              required
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            >
              <option value="pequeño">Pequeño</option>
              <option value="mediano">Mediano</option>
              <option value="grande">Grande</option>
            </select>
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

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Ubicación *</label>
            <LocationAutocomplete
              value={formData.location}
              onChange={(location) => setFormData({ ...formData, location })}
              placeholder="Ej: Madrid"
              className=""
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Descripción *</label>
            <textarea
              required
              placeholder="Describe al animal..."
              rows={5}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] resize-none text-sm"
            />
          </div>
        </div>

        {/* Health Status Section */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[#1C1B1F] mb-4">Estado de Salud</h2>
          <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 space-y-4 text-sm">
            {/* Vacunado Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[#1C1B1F] font-medium">Vacunado</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, vaccinated: !formData.vaccinated })}
                className={`rounded-full transition-colors relative h-5 w-[38px] ${
                  formData.vaccinated ? "bg-[#6750A4]" : "bg-[#79747E]"
                }`}
              >
                <div
                  className={`bg-white rounded-full absolute top-1 transition-transform size-3 ${
                    formData.vaccinated ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Microchip Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[#1C1B1F] font-medium">Microchip</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, microchipped: !formData.microchipped })}
                className={`rounded-full transition-colors relative size-auto w-[38px] h-5 ${
                  formData.microchipped ? "bg-[#6750A4]" : "bg-[#79747E]"
                }`}
              >
                <div
                  className={`bg-white rounded-full absolute top-1 transition-transform size-3 ${
                    formData.microchipped ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Esterilizado Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-[#1C1B1F] font-medium">Esterilizado</span>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, sterilized: !formData.sterilized })}
                className={`rounded-full transition-colors relative w-[38px] h-5 ${
                  formData.sterilized ? "bg-[#6750A4]" : "bg-[#79747E]"
                }`}
              >
                <div
                  className={`bg-white rounded-full absolute top-1 transition-transform size-3 ${
                    formData.sterilized ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <Button
          type="submit"
          disabled={loading}
          className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full text-base font-semibold shadow-md h-11 disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </form>
    </div>
  )
}
