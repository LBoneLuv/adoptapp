"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, X, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export interface ShelterRecord {
  id: string
  name: string
  email: string | null
  phone: string | null
  location: string
  description: string | null
  website: string | null
  profile_image_url: string | null
  cover_image_url: string | null
  social_links: { platform: string; url: string }[] | null
  status: string
}

const inputCls =
  "w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
const labelCls = "block text-sm font-medium text-[#49454F] mb-2"

function showToast(message: string, ok = true) {
  const el = document.createElement("div")
  el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${ok ? "#4CAF50" : "#F44336"};color:#fff;padding:16px 24px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9999;font-size:14px;font-weight:500;`
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2500)
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", body: fd })
  if (!res.ok) throw new Error("Error al subir la imagen")
  const { url } = await res.json()
  return url
}

export function ShelterForm({ initial, redirectTo = "/admin/super/protectoras" }: { initial: ShelterRecord; redirectTo?: string }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(initial.name || "")
  const [location, setLocation] = useState(initial.location || "")
  const [email, setEmail] = useState(initial.email || "")
  const [phone, setPhone] = useState(initial.phone || "")
  const [description, setDescription] = useState(initial.description || "")
  const [website, setWebsite] = useState(initial.website || "")
  const [profileImage, setProfileImage] = useState(initial.profile_image_url || "")
  const [coverImage, setCoverImage] = useState(initial.cover_image_url || "")
  const [socialLinks, setSocialLinks] = useState(initial.social_links || [])
  const [status, setStatus] = useState(initial.status || "pending")

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setter(await uploadFile(file))
      showToast("✓ Imagen subida")
    } catch {
      showToast("✗ Error al subir la imagen", false)
    }
  }

  async function handleSave() {
    if (!name || !location) {
      showToast("✗ Nombre y ubicación son obligatorios", false)
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("shelters")
      .update({
        name,
        location,
        email: email || null,
        phone: phone || null,
        description: description || null,
        website: website || null,
        profile_image_url: profileImage || null,
        cover_image_url: coverImage || null,
        social_links: socialLinks.filter((l) => l.url),
        status,
      })
      .eq("id", initial.id)
    setSaving(false)
    if (error) {
      console.error("[v0] Error saving shelter:", error)
      showToast("✗ Error al guardar", false)
      return
    }
    showToast("✓ Guardado correctamente")
    setTimeout(() => router.push(redirectTo), 800)
  }

  return (
    <div className="space-y-6 pb-28">
      <div>
        <label className={labelCls}>Foto de portada</label>
        <div className="relative bg-[#FFFBFE] rounded-3xl shadow-md overflow-hidden">
          <img src={coverImage || "/placeholder.svg?height=160&width=400"} alt="Portada" className="w-full h-40 object-cover" />
          <label className="absolute bottom-3 right-3 w-12 h-12 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#7965AF]">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, setCoverImage)} />
          </label>
        </div>
      </div>

      <div>
        <label className={labelCls}>Foto de perfil</label>
        <div className="flex justify-center">
          <div className="relative">
            <img src={profileImage || "/placeholder.svg?height=128&width=128"} alt="Perfil" className="w-28 h-28 rounded-full object-cover border-4 border-[#FFFBFE] shadow-md bg-[#E8DEF8]" />
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#7965AF]">
              <Camera className="w-5 h-5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, setProfileImage)} />
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Nombre *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Ubicación *</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Teléfono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>Sitio web</label>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
      </div>
      <div>
        <label className={labelCls}>Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={`${inputCls} resize-none`} />
      </div>

      <div>
        <label className={labelCls}>Redes sociales</label>
        <div className="space-y-3">
          {socialLinks.map((link, i) => (
            <div key={i} className="flex gap-2 items-start">
              <select
                value={link.platform}
                onChange={(e) => {
                  const u = [...socialLinks]
                  u[i].platform = e.target.value
                  setSocialLinks(u)
                }}
                className="w-1/3 px-3 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-sm"
              >
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
              </select>
              <input
                value={link.url}
                onChange={(e) => {
                  const u = [...socialLinks]
                  u[i].url = e.target.value
                  setSocialLinks(u)
                }}
                placeholder="https://..."
                className="flex-1 px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-sm"
              />
              <button type="button" onClick={() => setSocialLinks(socialLinks.filter((_, idx) => idx !== i))} className="px-3 py-3 bg-[#BA1A1A] text-white rounded-2xl hover:bg-[#A31515]">
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
          {socialLinks.length < 4 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setSocialLinks([...socialLinks, { platform: "instagram", url: "" }])}
              className="w-full border-2 border-[#6750A4] text-[#6750A4] hover:bg-[#E8DEF8] rounded-full text-sm font-semibold h-10 bg-transparent"
            >
              <Plus className="w-4 h-4 mr-1" /> Añadir red social
            </Button>
          )}
        </div>
      </div>

      <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
        <label className={labelCls}>Estado</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
          <option value="approved">Aprobada (visible)</option>
          <option value="pending">Pendiente</option>
          <option value="rejected">Rechazada</option>
        </select>
      </div>

      <Button onClick={handleSave} disabled={saving} className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full text-base font-semibold shadow-md h-11 disabled:opacity-50">
        {saving ? "Guardando..." : "Guardar cambios"}
      </Button>
    </div>
  )
}
