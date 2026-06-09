"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Camera, X, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LocationAutocomplete } from "@/components/location-autocomplete"
import { createClient } from "@/lib/supabase/client"
import {
  PROFESSIONAL_TYPES,
  type Professional,
  type ProfessionalService,
  type ProfessionalType,
  type ScheduleDay,
  type SocialLink,
} from "@/lib/professionals-config"

const DAYS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"]

function defaultSchedule(): ScheduleDay[] {
  return DAYS.map((day) => ({ day, open: "09:00", close: "20:00" }))
}

function showToast(message: string, ok = true) {
  const el = document.createElement("div")
  el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${
    ok ? "#4CAF50" : "#F44336"
  };color:white;padding:16px 24px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9999;font-size:14px;font-weight:500;`
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2500)
}

const inputCls =
  "w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
const labelCls = "block text-sm font-medium text-[#49454F] mb-2"

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", body: fd })
  if (!res.ok) throw new Error("Error al subir la imagen")
  const { url } = await res.json()
  return url
}

interface ProfessionalFormProps {
  initial?: Professional | null
}

export function ProfessionalForm({ initial }: ProfessionalFormProps) {
  const router = useRouter()
  const isEdit = !!initial
  const [saving, setSaving] = useState(false)

  const [type, setType] = useState<ProfessionalType>(initial?.type || "veterinario")
  const [name, setName] = useState(initial?.name || "")
  const [location, setLocation] = useState(initial?.location || "")
  const [address, setAddress] = useState(initial?.address || "")
  const [phone, setPhone] = useState(initial?.phone || "")
  const [whatsapp, setWhatsapp] = useState(initial?.whatsapp || "")
  const [email, setEmail] = useState(initial?.email || "")
  const [website, setWebsite] = useState(initial?.website || "")
  const [shortDescription, setShortDescription] = useState(initial?.short_description || "")
  const [description, setDescription] = useState(initial?.description || "")
  const [priceRange, setPriceRange] = useState(initial?.price_range || "")
  const [rating, setRating] = useState(initial?.rating != null ? String(initial.rating) : "")
  const [verified, setVerified] = useState(initial?.verified || false)
  const [featured, setFeatured] = useState(initial?.featured || false)
  const [emergency24h, setEmergency24h] = useState(initial?.emergency_24h || false)
  const [status, setStatus] = useState(initial?.status || "approved")
  const [profileImage, setProfileImage] = useState(initial?.profile_image_url || "")
  const [coverImage, setCoverImage] = useState(initial?.cover_image_url || "")
  const [gallery, setGallery] = useState<string[]>(initial?.gallery_images || [])
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(initial?.social_links || [])
  const [services, setServices] = useState<ProfessionalService[]>(initial?.services || [])
  const [schedule, setSchedule] = useState<ScheduleDay[]>(
    initial?.schedule && initial.schedule.length ? initial.schedule : defaultSchedule(),
  )

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

  async function handleGallery(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files) return
    try {
      const urls = await Promise.all(Array.from(files).map(uploadFile))
      setGallery((g) => [...g, ...urls])
    } catch {
      showToast("✗ Error al subir imágenes", false)
    }
  }

  async function handleSave() {
    if (!name || !location) {
      showToast("✗ Nombre y ubicación son obligatorios", false)
      return
    }
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const payload = {
      type,
      name,
      location,
      address: address || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      email: email || null,
      website: website || null,
      short_description: shortDescription || null,
      description: description || null,
      price_range: priceRange || null,
      rating: rating ? Number.parseFloat(rating) : null,
      verified,
      featured,
      emergency_24h: emergency24h,
      status,
      profile_image_url: profileImage || null,
      cover_image_url: coverImage || null,
      gallery_images: gallery,
      social_links: socialLinks.filter((l) => l.url),
      services: services.filter((s) => s.name),
      schedule,
    }

    let error
    if (isEdit) {
      ;({ error } = await supabase.from("professionals").update(payload).eq("id", initial!.id))
    } else {
      ;({ error } = await supabase.from("professionals").insert({ ...payload, owner_id: user?.id }))
    }

    setSaving(false)
    if (error) {
      console.error("[v0] Error saving professional:", error)
      showToast("✗ Error al guardar", false)
      return
    }
    showToast("✓ Guardado correctamente")
    setTimeout(() => router.push("/admin/super/profesionales"), 800)
  }

  return (
    <div className="space-y-6 pb-28">
      {/* Tipo */}
      <div>
        <label className={labelCls}>Tipo de profesional *</label>
        <select value={type} onChange={(e) => setType(e.target.value as ProfessionalType)} className={inputCls}>
          {Object.values(PROFESSIONAL_TYPES).map((t) => (
            <option key={t.type} value={t.type}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {/* Imágenes */}
      <div>
        <label className={labelCls}>Foto de portada</label>
        <div className="relative bg-[#FFFBFE] rounded-3xl shadow-md overflow-hidden">
          <img
            src={coverImage || "/placeholder.svg?height=160&width=400"}
            alt="Portada"
            className="w-full h-40 object-cover"
          />
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
            <img
              src={profileImage || "/placeholder.svg?height=128&width=128"}
              alt="Perfil"
              className="w-28 h-28 rounded-full object-cover border-4 border-[#FFFBFE] shadow-md bg-[#E8DEF8]"
            />
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#7965AF]">
              <Camera className="w-5 h-5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImage(e, setProfileImage)} />
            </label>
          </div>
        </div>
      </div>

      {/* Datos básicos */}
      <div>
        <label className={labelCls}>Nombre *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ej: Clínica Veterinaria San Roque" />
      </div>

      <div>
        <label className={labelCls}>Ubicación (ciudad) *</label>
        <LocationAutocomplete value={location} onChange={setLocation} placeholder="Ej: Málaga" />
      </div>

      <div>
        <label className={labelCls}>Dirección completa</label>
        <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputCls} placeholder="Calle, nº, CP" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Teléfono</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="+34 ..." />
        </div>
        <div>
          <label className={labelCls}>WhatsApp</label>
          <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputCls} placeholder="+34 ..." />
        </div>
      </div>

      <div>
        <label className={labelCls}>Email</label>
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="info@..." />
      </div>

      <div>
        <label className={labelCls}>Sitio web</label>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} className={inputCls} placeholder="https://..." />
      </div>

      <div>
        <label className={labelCls}>Descripción corta (para la tarjeta)</label>
        <input value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className={inputCls} placeholder="Una frase resumen" />
      </div>

      <div>
        <label className={labelCls}>Descripción (admite HTML)</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className={`${inputCls} resize-none`} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Rango de precio</label>
          <select value={priceRange} onChange={(e) => setPriceRange(e.target.value)} className={inputCls}>
            <option value="">—</option>
            <option value="€">€ (económico)</option>
            <option value="€€">€€ (medio)</option>
            <option value="€€€">€€€ (premium)</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Valoración (0-5)</label>
          <input
            type="number"
            min="0"
            max="5"
            step="0.1"
            value={rating}
            onChange={(e) => setRating(e.target.value)}
            className={inputCls}
            placeholder="4.8"
          />
        </div>
      </div>

      {/* Redes sociales */}
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
              <button
                type="button"
                onClick={() => setSocialLinks(socialLinks.filter((_, idx) => idx !== i))}
                className="px-3 py-3 bg-[#BA1A1A] text-white rounded-2xl hover:bg-[#A31515]"
              >
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

      {/* Servicios */}
      <div>
        <label className={labelCls}>Servicios</label>
        <div className="space-y-3">
          {services.map((s, i) => (
            <div key={i} className="bg-[#FFFBFE] rounded-2xl p-3 shadow-sm space-y-2">
              <div className="flex gap-2">
                <input
                  value={s.name}
                  onChange={(e) => {
                    const u = [...services]
                    u[i].name = e.target.value
                    setServices(u)
                  }}
                  placeholder="Nombre del servicio"
                  className="flex-1 px-3 py-2 border-2 border-[#79747E] rounded-xl focus:border-[#6750A4] focus:outline-none text-sm"
                />
                <input
                  value={s.price || ""}
                  onChange={(e) => {
                    const u = [...services]
                    u[i].price = e.target.value
                    setServices(u)
                  }}
                  placeholder="Precio"
                  className="w-24 px-3 py-2 border-2 border-[#79747E] rounded-xl focus:border-[#6750A4] focus:outline-none text-sm"
                />
                <button
                  type="button"
                  onClick={() => setServices(services.filter((_, idx) => idx !== i))}
                  className="px-2 bg-[#BA1A1A] text-white rounded-xl hover:bg-[#A31515]"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <input
                value={s.description || ""}
                onChange={(e) => {
                  const u = [...services]
                  u[i].description = e.target.value
                  setServices(u)
                }}
                placeholder="Descripción (opcional)"
                className="w-full px-3 py-2 border-2 border-[#79747E] rounded-xl focus:border-[#6750A4] focus:outline-none text-sm"
              />
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() => setServices([...services, { name: "", description: "", price: "" }])}
            className="w-full border-2 border-[#6750A4] text-[#6750A4] hover:bg-[#E8DEF8] rounded-full text-sm font-semibold h-10 bg-transparent"
          >
            <Plus className="w-4 h-4 mr-1" /> Añadir servicio
          </Button>
        </div>
      </div>

      {/* Horario */}
      <div>
        <label className={labelCls}>Horario</label>
        <div className="bg-[#FFFBFE] rounded-2xl p-3 shadow-sm space-y-2">
          {schedule.map((d, i) => {
            const closed = !d.open || !d.close
            return (
              <div key={i} className="flex items-center gap-2">
                <span className="w-24 text-sm text-[#1C1B1F]">{d.day}</span>
                {closed ? (
                  <span className="flex-1 text-sm text-[#C5221F]">Cerrado</span>
                ) : (
                  <div className="flex-1 flex items-center gap-1">
                    <input
                      type="time"
                      value={d.open || ""}
                      onChange={(e) => {
                        const u = [...schedule]
                        u[i].open = e.target.value
                        setSchedule(u)
                      }}
                      className="px-2 py-1.5 border-2 border-[#79747E] rounded-lg text-sm"
                    />
                    <span className="text-[#79747E]">-</span>
                    <input
                      type="time"
                      value={d.close || ""}
                      onChange={(e) => {
                        const u = [...schedule]
                        u[i].close = e.target.value
                        setSchedule(u)
                      }}
                      className="px-2 py-1.5 border-2 border-[#79747E] rounded-lg text-sm"
                    />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const u = [...schedule]
                    u[i] = closed
                      ? { ...u[i], open: "09:00", close: "20:00" }
                      : { ...u[i], open: null, close: null }
                    setSchedule(u)
                  }}
                  className="text-xs text-[#6750A4] font-medium px-2"
                >
                  {closed ? "Abrir" : "Cerrar"}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Galería */}
      <div>
        <label className={labelCls}>Galería de fotos</label>
        <label className="block bg-[#FFFBFE] rounded-3xl shadow-md p-6 cursor-pointer hover:shadow-lg text-center">
          <input type="file" multiple accept="image/*" className="hidden" onChange={handleGallery} />
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 bg-[#E8DEF8] rounded-full flex items-center justify-center">
              <Camera className="w-6 h-6 text-[#6750A4]" />
            </div>
            <p className="text-sm text-[#49454F]">Toca para añadir fotos</p>
          </div>
        </label>
        {gallery.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mt-3">
            {gallery.map((url, i) => (
              <div key={i} className="relative">
                <img src={url || "/placeholder.svg"} alt={`Foto ${i + 1}`} className="w-full h-24 object-cover rounded-2xl" />
                <button
                  type="button"
                  onClick={() => setGallery(gallery.filter((_, idx) => idx !== i))}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-[#6750A4] rounded-full flex items-center justify-center shadow-md"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flags */}
      <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 space-y-4 text-sm">
        {[
          { label: "Verificado", value: verified, set: setVerified },
          { label: "Destacado", value: featured, set: setFeatured },
          { label: "Urgencias 24h", value: emergency24h, set: setEmergency24h },
        ].map((t) => (
          <div key={t.label} className="flex items-center justify-between">
            <span className="text-[#1C1B1F] font-medium">{t.label}</span>
            <button
              type="button"
              onClick={() => t.set(!t.value)}
              className={`rounded-full transition-colors relative h-5 w-[38px] ${t.value ? "bg-[#6750A4]" : "bg-[#79747E]"}`}
            >
              <div className={`bg-white rounded-full absolute top-1 transition-transform size-3 ${t.value ? "translate-x-6" : "translate-x-1"}`} />
            </button>
          </div>
        ))}
        <div>
          <label className={labelCls}>Estado</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={inputCls}>
            <option value="approved">Aprobado (visible)</option>
            <option value="pending">Pendiente</option>
            <option value="rejected">Rechazado</option>
          </select>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full text-base font-semibold shadow-md h-11 disabled:opacity-50"
      >
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear profesional"}
      </Button>
    </div>
  )
}
