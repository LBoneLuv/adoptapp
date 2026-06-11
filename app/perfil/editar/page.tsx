"use client"

import type React from "react"
import { Camera, ArrowLeft, MapPin, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const fieldCls =
  "w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] text-sm h-11"

export default function EditarPerfilPage() {
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
    async function load() {
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
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleSave() {
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
    setSaving(false)
    if (error) {
      alert("Error al guardar el perfil")
      return
    }
    router.push("/perfil")
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    const formData = new FormData()
    formData.append("file", file)
    const response = await fetch("/api/upload", { method: "POST", body: formData })
    setUploading(false)
    if (!response.ok) {
      alert("Error al subir la foto")
      return
    }
    const { url } = await response.json()
    await supabase.from("profiles").update({ avatar_url: url }).eq("id", user.id)
    setProfile({ ...profile, avatar_url: url })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      <header className="flex items-center gap-3 px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10">
        <Link href="/perfil" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-base">Editar perfil</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Photo */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-[#E8DEF8] border-4 border-[#6750A4] shadow-lg">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url || "/placeholder.svg"} alt="Foto de perfil" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[#6750A4]">
                    {profile.display_name?.[0] || profile.email?.[0] || "U"}
                  </div>
                )}
              </div>
              <label htmlFor="photo-upload" className="absolute bottom-0 right-0 w-10 h-10 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg hover:bg-[#7965AF] cursor-pointer">
                <Camera className="w-5 h-5 text-white" />
              </label>
              <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </div>
            {uploading && <p className="text-sm text-[#79747E]">Subiendo...</p>}
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1B1F] block">Nombre</label>
              <Input value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} placeholder="Tu nombre" className={fieldCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1B1F] block">Correo electrónico</label>
              <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} placeholder="tu@email.com" className={fieldCls} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1B1F] block">Teléfono</label>
              <Input type="tel" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+34 600 000 000" className={fieldCls} />
            </div>

            <Link
              href="/perfil/direcciones"
              className="flex items-center gap-3 bg-[#FFFBFE] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow border border-[#E8DEF8]"
            >
              <div className="w-10 h-10 rounded-full bg-[#E8DEF8] flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-[#6750A4]" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#1C1B1F] text-sm">Mis direcciones</p>
                <p className="text-xs text-[#79747E]">Gestiona tu libreta de direcciones de envío</p>
              </div>
              <ChevronRight className="w-5 h-5 text-[#79747E]" />
            </Link>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full mt-8 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold shadow-lg disabled:opacity-50">
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </div>
  )
}
