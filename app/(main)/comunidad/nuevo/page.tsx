"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ImageIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
}

const inputCls =
  "w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"

export default function NuevoHiloPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const presetSlug = searchParams.get("cat")
  const [categories, setCategories] = useState<Category[]>([])
  const [categoryId, setCategoryId] = useState("")
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("forum_categories")
      .select("id, name, slug, icon")
      .order("order_index")
      .then(({ data }) => {
        const cats = (data as Category[]) || []
        setCategories(cats)
        const preset = cats.find((c) => c.slug === presetSlug)
        setCategoryId(preset ? preset.id : cats[0]?.id || "")
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    setUploading(false)
    if (res.ok) {
      const { url } = await res.json()
      setImageUrl(url)
    }
  }

  async function submit() {
    if (!title.trim() || !content.trim() || !categoryId) {
      alert("Elige categoría y completa título y contenido")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    const { data, error } = await supabase
      .from("forum_threads")
      .insert({
        category_id: categoryId,
        user_id: user.id,
        title: title.trim(),
        content: content.trim(),
        image_url: imageUrl || null,
      })
      .select("id")
      .single()
    setSaving(false)
    if (error || !data) {
      alert("Error al crear el hilo")
      return
    }
    router.push(`/comunidad/hilo/${data.id}`)
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4 pb-24">
        <h1 className="font-bold text-[#1C1B1F] text-lg">Nuevo hilo</h1>

        <div>
          <label className="text-sm font-medium text-[#49454F] block mb-2">Categoría</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.icon} {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium text-[#49454F] block mb-2">Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Un título claro" className={inputCls} maxLength={140} />
        </div>

        <div>
          <label className="text-sm font-medium text-[#49454F] block mb-2">Contenido</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8} placeholder="Escribe tu mensaje..." className={`${inputCls} resize-none`} />
        </div>

        {/* Imagen opcional */}
        {imageUrl ? (
          <div className="relative">
            <img src={imageUrl || "/placeholder.svg"} alt="" className="w-full h-48 object-cover rounded-2xl" />
            <button onClick={() => setImageUrl("")} className="absolute top-2 right-2 w-8 h-8 bg-[#BA1A1A] rounded-full flex items-center justify-center">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
        ) : (
          <label className="flex items-center gap-2 px-4 py-2 bg-[#E8DEF8] rounded-full w-fit cursor-pointer hover:bg-[#D0BCFF]">
            <ImageIcon className="w-5 h-5 text-[#6750A4]" />
            <span className="text-sm font-medium text-[#6750A4]">{uploading ? "Subiendo..." : "Adjuntar foto"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} disabled={uploading} />
          </label>
        )}

        <Button onClick={submit} disabled={saving} className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold disabled:opacity-50">
          {saving ? "Publicando..." : "Publicar hilo"}
        </Button>
      </div>
    </div>
  )
}
