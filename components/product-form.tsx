"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Camera } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { DocUpload } from "@/components/doc-upload"
import { RichTextEditor } from "@/components/rich-text-editor"

export interface ProductRecord {
  id: string
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  image_url: string | null
  gallery_images: string[] | null
  category_id: string | null
  stock: number
  featured: boolean
  is_new: boolean
}

interface Category {
  id: string
  name: string
}

const inputCls =
  "w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
const labelCls = "block text-sm font-medium text-[#49454F] mb-2"

function showToast(message: string, ok = true) {
  const el = document.createElement("div")
  el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${
    ok ? "#4CAF50" : "#F44336"
  };color:white;padding:16px 24px;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.3);z-index:9999;font-size:14px;font-weight:500;`
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2500)
}

export function ProductForm({ initial }: { initial?: ProductRecord | null }) {
  const router = useRouter()
  const isEdit = !!initial
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(initial?.name || "")
  const [description, setDescription] = useState(initial?.description || "")
  const [price, setPrice] = useState(initial?.price != null ? String(initial.price) : "")
  const [compareAtPrice, setCompareAtPrice] = useState(
    initial?.compare_at_price != null ? String(initial.compare_at_price) : "",
  )
  const [imageUrl, setImageUrl] = useState(initial?.image_url || "")
  const [gallery, setGallery] = useState<string[]>(initial?.gallery_images || [])
  const [categoryId, setCategoryId] = useState(initial?.category_id || "")
  const [stock, setStock] = useState(initial?.stock != null ? String(initial.stock) : "0")
  const [featured, setFeatured] = useState(initial?.featured || false)
  const [isNew, setIsNew] = useState(initial?.is_new || false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("shop_categories")
      .select("id, name")
      .order("name")
      .then(({ data }) => setCategories(data || []))
  }, [])

  async function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) {
      showToast("✗ Error al subir la imagen", false)
      return
    }
    const { url } = await res.json()
    setImageUrl(url)
    showToast("✓ Imagen subida")
  }

  async function handleSave() {
    if (!name || !price) {
      showToast("✗ Nombre y precio son obligatorios", false)
      return
    }
    setSaving(true)
    const supabase = createClient()
    const payload = {
      name,
      description: description || null,
      price: Number.parseFloat(price),
      compare_at_price: compareAtPrice ? Number.parseFloat(compareAtPrice) : null,
      image_url: imageUrl || null,
      gallery_images: gallery,
      category_id: categoryId || null,
      stock: Number.parseInt(stock || "0", 10),
      featured,
      is_new: isNew,
    }
    const { error } = isEdit
      ? await supabase.from("shop_products").update(payload).eq("id", initial!.id)
      : await supabase.from("shop_products").insert(payload)

    setSaving(false)
    if (error) {
      console.error("[v0] Error saving product:", error)
      showToast("✗ Error al guardar", false)
      return
    }
    showToast("✓ Guardado")
    setTimeout(() => router.push("/admin/super/tienda"), 800)
  }

  return (
    <div className="space-y-5 pb-28">
      <div>
        <label className={labelCls}>Imagen del producto</label>
        <div className="relative bg-[#FFFBFE] rounded-3xl shadow-md overflow-hidden">
          <img
            src={imageUrl || "/placeholder.svg?height=240&width=400"}
            alt="Producto"
            className="w-full h-48 object-cover"
          />
          <label className="absolute bottom-3 right-3 w-12 h-12 bg-[#6750A4] rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-[#7965AF]">
            <Camera className="w-6 h-6 text-white" />
            <input type="file" accept="image/*" className="hidden" onChange={handleImage} />
          </label>
        </div>
      </div>

      <div>
        <label className={labelCls}>Galería de fotos</label>
        <DocUpload
          value={gallery}
          onChange={(urls) => setGallery(urls as string[])}
          multiple
          accept="image/*"
          label="Añadir fotos a la galería"
          hint="Se muestran en la ficha del producto"
        />
      </div>

      <div>
        <label className={labelCls}>Nombre *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Ej: Pienso Premium" />
      </div>

      <div>
        <label className={labelCls}>Descripción</label>
        <RichTextEditor value={description} onChange={setDescription} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className={labelCls}>Precio (€) *</label>
          <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputCls} placeholder="0.00" />
        </div>
        <div>
          <label className={labelCls}>Precio anterior (oferta)</label>
          <input type="number" min="0" step="0.01" value={compareAtPrice} onChange={(e) => setCompareAtPrice(e.target.value)} className={inputCls} placeholder="Opcional" />
        </div>
      </div>

      <div>
        <label className={labelCls}>Stock</label>
        <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Categoría</label>
        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputCls}>
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 space-y-4 text-sm">
        {[
          { label: "Destacado", value: featured, set: setFeatured },
          { label: "Nuevo", value: isNew, set: setIsNew },
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
      </div>

      <Button
        onClick={handleSave}
        disabled={saving}
        className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full text-base font-semibold shadow-md h-11 disabled:opacity-50"
      >
        {saving ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear producto"}
      </Button>
    </div>
  )
}
