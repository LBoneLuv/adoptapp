"use client"

import type React from "react"

import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

type Shelter = {
  id: string
  name: string
  location: string
  description: string
  profile_image_url: string | null
  cover_image_url: string | null
}

export default function EditarPerfilProtectoraPage() {
  const { toast } = useToast()
  const [shelter, setShelter] = useState<Shelter | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [location, setLocation] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    async function loadShelter() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data } = await supabase.from("shelters").select("*").eq("id", user.id).single()

        if (data) {
          setShelter(data)
          setName(data.name)
          setLocation(data.location)
          setDescription(data.description || "")
        }
      }
      setLoading(false)
    }

    loadShelter()
  }, [])

  async function handleSave() {
    if (!shelter) return

    setSaving(true)

    const supabase = createClient()
    const { error } = await supabase
      .from("shelters")
      .update({
        name,
        location,
        description,
      })
      .eq("id", shelter.id)

    if (!error) {
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
      toastEl.textContent = "✓ Cambios guardados correctamente"
      document.body.appendChild(toastEl)

      setTimeout(() => {
        toastEl.remove()
      }, 3000)
    } else {
      console.error("Error updating shelter:", error)
      const toastEl = document.createElement("div")
      toastEl.style.cssText = `
        position: fixed;
        bottom: 80px;
        left: 50%;
        transform: translateX(-50%);
        background: #F44336;
        color: white;
        padding: 16px 24px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 9999;
        font-size: 14px;
        font-weight: 500;
        animation: slideUp 0.3s ease-out;
      `
      toastEl.textContent = "✗ Error al guardar los cambios"
      document.body.appendChild(toastEl)

      setTimeout(() => {
        toastEl.remove()
      }, 3000)
    }

    setSaving(false)
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !shelter) return

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const { url } = await response.json()

    const supabase = createClient()
    await supabase.from("shelters").update({ cover_image_url: url }).eq("id", shelter.id)

    setShelter({ ...shelter, cover_image_url: url })

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
    toastEl.textContent = "✓ Foto de portada actualizada"
    document.body.appendChild(toastEl)

    setTimeout(() => {
      toastEl.remove()
    }, 3000)
  }

  async function handleProfileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !shelter) return

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    })

    const { url } = await response.json()

    const supabase = createClient()
    await supabase.from("shelters").update({ profile_image_url: url }).eq("id", shelter.id)

    setShelter({ ...shelter, profile_image_url: url })

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
    toastEl.textContent = "✓ Foto de perfil actualizada"
    document.body.appendChild(toastEl)

    setTimeout(() => {
      toastEl.remove()
    }, 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <p className="text-[#49454F]">Cargando...</p>
      </div>
    )
  }

  if (!shelter) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <p className="text-[#49454F]">No se encontró la protectora</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      {/* Header */}
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm">
        <h1 className="font-bold text-[#1C1B1F] text-base">Editar Perfil de la Protectora</h1>
      </header>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        {/* Cover Photo Section */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[#1C1B1F] mb-3">Foto de Portada</h2>
          <div className="relative bg-[#FFFBFE] rounded-3xl shadow-md overflow-hidden">
            <img
              src={shelter.cover_image_url || "/placeholder.svg?height=160&width=400"}
              alt="Portada actual"
              className="w-full h-40 object-cover"
            />
            <label className="absolute bottom-3 right-3 w-12 h-12 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg hover:bg-[#7965AF] transition-colors cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
            </label>
          </div>
        </div>

        {/* Profile Photo Section */}
        <div className="mb-6">
          <h2 className="text-base font-semibold text-[#1C1B1F] mb-3">Foto de Perfil</h2>
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={shelter.profile_image_url || "/placeholder.svg?height=128&width=128"}
                alt="Perfil actual"
                className="w-32 h-32 rounded-full object-cover border-4 border-[#FFFBFE] shadow-md"
              />
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg hover:bg-[#7965AF] transition-colors cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handleProfileUpload} />
              </label>
            </div>
          </div>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Nombre de la Protectora</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Ubicación</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#49454F] mb-2">Descripción de la Protectora</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={6}
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] resize-none text-sm"
            />
          </div>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full text-base font-semibold shadow-md h-11 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar Cambios"}
        </Button>
      </div>

      {/* Admin Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#FFFBFE] px-4 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <Link
            href="/admin/animales"
            className="flex flex-col items-center gap-1 py-2 px-6 text-[#49454F] hover:text-[#6750A4] transition-colors"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
              <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
              <ellipse cx="5" cy="10" rx="2" ry="2.5" />
              <ellipse cx="19" cy="10" rx="2" ry="2.5" />
              <path d="M12 10c-2.5 0-4.5 1.5-5 4-.3 1.5.5 3 2 3.5 1 .3 2 .5 3 .5s2-.2 3-.5c1.5-.5 2.3-2 2-3.5-.5-2.5-2.5-4-5-4z" />
            </svg>
            <span className="text-xs font-medium">Animales</span>
          </Link>
          <button className="flex flex-col items-center gap-1 py-2 px-6 text-[#6750A4]">
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="text-xs font-medium">Mi Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
