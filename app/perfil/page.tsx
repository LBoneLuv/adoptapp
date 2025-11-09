"use client"

import type React from "react"

import { Camera, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export default function PerfilPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState({
    display_name: "",
    email: "",
    phone: "",
    avatar_url: "",
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/login")
        return
      }

      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (data) {
        setProfile({
          display_name: data.display_name || "",
          email: data.email || user.email || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
        })
      }
    } catch (error) {
      console.error("Error loading profile:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: profile.display_name,
          email: profile.email,
          phone: profile.phone,
        })
        .eq("id", user.id)

      if (error) throw error

      alert("Perfil actualizado correctamente")
    } catch (error) {
      console.error("Error saving profile:", error)
      alert("Error al guardar el perfil")
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    try {
      const file = e.target.files?.[0]
      if (!file) return

      setUploading(true)
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Upload to Vercel Blob
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()

      // Update profile with new avatar URL
      const { error } = await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id)

      if (error) throw error

      setProfile({ ...profile, avatar_url: url })
      alert("Foto actualizada correctamente")
    } catch (error) {
      console.error("Error uploading photo:", error)
      alert("Error al subir la foto")
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FEF7FF]">
        <div className="text-[#6750A4]">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-[#FEF7FF]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-[#FFFBFE] shadow-sm">
        <Link href="/adopta" className="flex items-center gap-2">
          <div className="w-10 h-10 bg-[#6750A4] rounded-2xl flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
              <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
              <ellipse cx="5" cy="10" rx="2" ry="2.5" />
              <ellipse cx="19" cy="10" rx="2" ry="2.5" />
              <path d="M12 10c-2.5 0-4.5 1.5-5 4-.3 1.5.5 3 2 3.5 1 .3 2 .5 3 .5s2-.2 3-.5c1.5-.5 2.3-2 2-3.5-.5-2.5-2.5-4-5-4z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#1C1B1F]">Adoptapp</h1>
        </Link>
        <h2 className="font-semibold text-[#1C1B1F] text-sm">Ajustes de Perfil</h2>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Profile Photo Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-[#E8DEF8] border-4 border-[#6750A4] shadow-lg">
                {profile.avatar_url ? (
                  <img
                    src={profile.avatar_url || "/placeholder.svg"}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#6750A4]">
                    {profile.display_name?.[0] || profile.email?.[0] || "U"}
                  </div>
                )}
              </div>
              <label
                htmlFor="photo-upload"
                className="absolute bottom-0 right-0 w-10 h-10 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg hover:bg-[#7965AF] transition-colors cursor-pointer"
              >
                <Camera className="w-5 h-5 text-white" />
              </label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
                disabled={uploading}
              />
            </div>
            <Button
              variant="outline"
              className="bg-[#FFFBFE] border-[#6750A4] text-[#6750A4] hover:bg-[#E8DEF8] hover:text-[#6750A4] rounded-full px-6"
              onClick={() => document.getElementById("photo-upload")?.click()}
              disabled={uploading}
            >
              {uploading ? "Subiendo..." : "Cambiar foto"}
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[#1C1B1F] block">
                Nombre
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={profile.display_name}
                onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
                className="w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] text-sm h-11"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#1C1B1F] block">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] h-11 text-sm"
              />
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-[#1C1B1F] block">
                Teléfono
              </label>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 000 000"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] text-sm h-11"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full mt-8 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-14 text-base font-semibold shadow-lg"
          >
            {saving ? "Guardando..." : "Guardar Cambios"}
          </Button>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full mt-4 border-2 border-[#BA1A1A] text-[#BA1A1A] hover:bg-[#BA1A1A] hover:text-white rounded-full h-14 text-base font-semibold bg-transparent"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </div>
    </div>
  )
}
