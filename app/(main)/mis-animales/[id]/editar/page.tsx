"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Camera, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

const inputCls =
  "w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
const labelCls = "block text-sm font-medium text-[#49454F] mb-2"

export default function EditarMascotaPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [photoUrl, setPhotoUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState({
    name: "",
    species: "perro",
    breed: "",
    birth_date: "",
    gender: "macho",
    microchip: "",
    notes: "",
  })

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from("user_pets")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (data) {
          setForm({
            name: data.name || "",
            species: data.species || "perro",
            breed: data.breed || "",
            birth_date: data.birth_date || "",
            gender: data.gender || "macho",
            microchip: data.microchip || "",
            notes: data.notes || "",
          })
          setPhotoUrl(data.photo_url || "")
        }
        setLoading(false)
      })
  }, [id])

  async function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setPhotoUrl(url)
    }
  }

  async function handleSave() {
    if (!form.name) {
      alert("El nombre es obligatorio")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from("user_pets")
      .update({
        name: form.name,
        species: form.species,
        breed: form.breed || null,
        birth_date: form.birth_date || null,
        gender: form.gender,
        microchip: form.microchip || null,
        notes: form.notes || null,
        photo_url: photoUrl || null,
      })
      .eq("id", id)
    setSaving(false)
    if (error) {
      alert("Error al guardar")
      return
    }
    router.push(`/mis-animales/${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <Link
          href={`/mis-animales/${id}`}
          className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF]"
        >
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-base">Editar mascota</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 pb-28">
        {/* Foto */}
        <div className="flex justify-center">
          <div className="relative">
            <img
              src={photoUrl || "/placeholder.svg?height=128&width=128"}
              alt="Mascota"
              className="w-32 h-32 rounded-3xl object-cover border-4 border-[#FFFBFE] shadow-md bg-[#E8DEF8]"
            />
            <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#7965AF]">
              <Camera className="w-5 h-5 text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhoto} disabled={uploading} />
            </label>
            {photoUrl && (
              <button
                onClick={() => setPhotoUrl("")}
                className="absolute -top-2 -right-2 w-6 h-6 bg-[#BA1A1A] rounded-full flex items-center justify-center shadow-md"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>Nombre *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Especie</label>
          <select value={form.species} onChange={(e) => setForm({ ...form, species: e.target.value })} className={inputCls}>
            <option value="perro">Perro</option>
            <option value="gato">Gato</option>
            <option value="conejo">Conejo</option>
            <option value="hamster">Hámster</option>
            <option value="ave">Ave</option>
            <option value="otro">Otro</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Raza</label>
          <input value={form.breed} onChange={(e) => setForm({ ...form, breed: e.target.value })} className={inputCls} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Fecha de nacimiento</label>
            <input type="date" value={form.birth_date} onChange={(e) => setForm({ ...form, birth_date: e.target.value })} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Género</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className={inputCls}>
              <option value="macho">Macho</option>
              <option value="hembra">Hembra</option>
            </select>
          </div>
        </div>
        <div>
          <label className={labelCls}>Nº de microchip</label>
          <input value={form.microchip} onChange={(e) => setForm({ ...form, microchip: e.target.value })} className={inputCls} placeholder="Opcional" />
        </div>
        <div>
          <label className={labelCls}>Notas</label>
          <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className={`${inputCls} resize-none`} placeholder="Alergias, carácter, comida favorita..." />
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </div>
  )
}
