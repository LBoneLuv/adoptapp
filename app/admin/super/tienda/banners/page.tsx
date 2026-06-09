"use client"

import type React from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Camera, Trash2, Plus, ImagePlus } from "lucide-react"

interface Banner {
  id: string
  image_url: string
  link_url: string | null
  title: string | null
  order_index: number
  active: boolean
}

const inputCls =
  "w-full px-3 py-2 bg-[#FFFBFE] border-2 border-[#79747E] rounded-xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"

function toast(msg: string, ok = true) {
  const el = document.createElement("div")
  el.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:${ok ? "#4CAF50" : "#F44336"};color:#fff;padding:14px 22px;border-radius:12px;z-index:9999;font-size:14px;font-weight:500;`
  el.textContent = msg
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 2200)
}

export default function BannersAdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [banners, setBanners] = useState<Banner[]>([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.replace("/login")
        return
      }
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
      const { data: shelter } = await supabase.from("shelters").select("role").eq("id", user.id).maybeSingle()
      if (profile?.role !== "super_admin" && shelter?.role !== "super_admin") {
        router.replace("/adopta")
        return
      }
      setAllowed(true)
      await load()
      setLoading(false)
    }
    init()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from("shop_banners").select("*").order("order_index")
    setBanners((data as Banner[]) || [])
  }

  async function addBanner(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) {
      setUploading(false)
      toast("✗ Error al subir la imagen", false)
      return
    }
    const { url } = await res.json()
    const supabase = createClient()
    const { error } = await supabase
      .from("shop_banners")
      .insert({ image_url: url, order_index: banners.length + 1, active: true })
    setUploading(false)
    if (error) {
      toast("✗ Error al crear el banner", false)
      return
    }
    toast("✓ Banner añadido")
    await load()
  }

  function patch(id: string, field: keyof Banner, value: any) {
    setBanners((bs) => bs.map((b) => (b.id === id ? { ...b, [field]: value } : b)))
  }

  async function save(banner: Banner) {
    const supabase = createClient()
    const { error } = await supabase
      .from("shop_banners")
      .update({
        title: banner.title || null,
        link_url: banner.link_url || null,
        order_index: banner.order_index,
        active: banner.active,
      })
      .eq("id", banner.id)
    toast(error ? "✗ Error al guardar" : "✓ Guardado", !error)
  }

  async function replaceImage(id: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append("file", file)
    const res = await fetch("/api/upload", { method: "POST", body: fd })
    if (!res.ok) {
      setUploading(false)
      toast("✗ Error al subir la imagen", false)
      return
    }
    const { url } = await res.json()
    const supabase = createClient()
    const { error } = await supabase.from("shop_banners").update({ image_url: url }).eq("id", id)
    setUploading(false)
    if (error) {
      toast("✗ Error al actualizar la imagen", false)
      return
    }
    patch(id, "image_url", url)
    toast("✓ Imagen actualizada")
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar este banner?")) return
    const supabase = createClient()
    const { error } = await supabase.from("shop_banners").delete().eq("id", id)
    if (error) {
      toast("✗ Error al eliminar", false)
      return
    }
    setBanners((bs) => bs.filter((b) => b.id !== id))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }
  if (!allowed) return null

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-24">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/admin/super/tienda" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
          </Link>
          <h1 className="font-bold text-[#1C1B1F] text-lg">Banners</h1>
        </div>
        <label className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-10 px-4 flex items-center gap-1 cursor-pointer text-sm font-medium">
          <Plus className="w-4 h-4" /> {uploading ? "Subiendo..." : "Añadir"}
          <input type="file" accept="image/*" className="hidden" onChange={addBanner} disabled={uploading} />
        </label>
      </header>

      <div className="px-4 py-4 space-y-4">
        {banners.length === 0 ? (
          <p className="text-center text-[#79747E] py-12">No hay banners. Añade el primero con el botón de arriba.</p>
        ) : (
          banners.map((b) => (
            <div key={b.id} className="bg-[#FFFBFE] rounded-3xl shadow-md overflow-hidden">
              <div className="relative">
                <img src={b.image_url || "/placeholder.svg"} alt={b.title || "banner"} className="w-full h-32 object-cover" />
                <label className="absolute bottom-2 right-2 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-9 px-3 flex items-center gap-1 cursor-pointer text-xs font-medium shadow-lg">
                  <ImagePlus className="w-4 h-4" /> Cambiar imagen
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => replaceImage(b.id, e)} />
                </label>
              </div>
              <div className="p-3 space-y-2">
                <input
                  value={b.title || ""}
                  onChange={(e) => patch(b.id, "title", e.target.value)}
                  placeholder="Título"
                  className={inputCls}
                />
                <input
                  value={b.link_url || ""}
                  onChange={(e) => patch(b.id, "link_url", e.target.value)}
                  placeholder="Enlace (ej: /tienda/categoria/xxx)"
                  className={inputCls}
                />
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-[#79747E]">Orden</span>
                    <input
                      type="number"
                      value={b.order_index}
                      onChange={(e) => patch(b.id, "order_index", Number.parseInt(e.target.value || "0"))}
                      className="w-16 px-2 py-1 border-2 border-[#79747E] rounded-lg text-sm"
                    />
                  </div>
                  <button
                    onClick={() => patch(b.id, "active", !b.active)}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="text-[#1C1B1F]">Activo</span>
                    <span className={`rounded-full relative h-5 w-[38px] ${b.active ? "bg-[#6750A4]" : "bg-[#79747E]"}`}>
                      <span className={`bg-white rounded-full absolute top-1 transition-transform h-3 w-3 ${b.active ? "translate-x-6" : "translate-x-1"}`} />
                    </span>
                  </button>
                  <div className="flex-1" />
                  <button onClick={() => remove(b.id)} className="w-9 h-9 rounded-full bg-[#FDECEA] flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-[#C5221F]" />
                  </button>
                </div>
                <Button
                  onClick={() => save(b)}
                  className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-9 text-sm font-semibold"
                >
                  Guardar
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
