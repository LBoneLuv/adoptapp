"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, Star, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { createClient } from "@/lib/supabase/client"

export interface Address {
  id: string
  label: string | null
  name: string
  phone: string | null
  address: string
  city: string
  postal_code: string
  is_default: boolean
}

const inputCls =
  "w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"

const EMPTY = { label: "", name: "", phone: "", address: "", city: "", postal_code: "", is_default: false }

export default function DireccionesPage() {
  const router = useRouter()
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function load() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    const { data } = await supabase
      .from("user_addresses")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })
    setAddresses((data as Address[]) || [])
    setLoading(false)
  }

  function openNew() {
    setEditingId(null)
    setForm({ ...EMPTY, is_default: addresses.length === 0 })
    setOpen(true)
  }

  function openEdit(a: Address) {
    setEditingId(a.id)
    setForm({
      label: a.label || "",
      name: a.name,
      phone: a.phone || "",
      address: a.address,
      city: a.city,
      postal_code: a.postal_code,
      is_default: a.is_default,
    })
    setOpen(true)
  }

  async function save() {
    if (!form.name || !form.address || !form.city || !form.postal_code) {
      alert("Completa nombre, dirección, ciudad y código postal")
      return
    }
    setSaving(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    // Si se marca por defecto, quitar el flag a las demás
    if (form.is_default) {
      await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id)
    }
    const payload = {
      label: form.label || null,
      name: form.name,
      phone: form.phone || null,
      address: form.address,
      city: form.city,
      postal_code: form.postal_code,
      is_default: form.is_default,
    }
    const { error } = editingId
      ? await supabase.from("user_addresses").update(payload).eq("id", editingId)
      : await supabase.from("user_addresses").insert({ ...payload, user_id: user.id })
    setSaving(false)
    if (error) {
      alert("Error al guardar la dirección")
      return
    }
    setOpen(false)
    load()
  }

  async function setDefault(a: Address) {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from("user_addresses").update({ is_default: false }).eq("user_id", user.id)
    await supabase.from("user_addresses").update({ is_default: true }).eq("id", a.id)
    load()
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta dirección?")) return
    const supabase = createClient()
    await supabase.from("user_addresses").delete().eq("id", id)
    setAddresses((as) => as.filter((x) => x.id !== id))
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      <header className="flex items-center justify-between px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/perfil" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
          </Link>
          <h1 className="font-bold text-[#1C1B1F] text-base">Mis direcciones</h1>
        </div>
        <Button onClick={openNew} className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-10">
          <Plus className="w-4 h-4 mr-1" /> Añadir
        </Button>
      </header>

      <div className="flex-1 px-4 py-4 space-y-3 max-w-md mx-auto w-full">
        {loading ? (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#6750A4] mx-auto mt-8" />
        ) : addresses.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#E8DEF8] flex items-center justify-center mx-auto mb-3">
              <Home className="w-8 h-8 text-[#6750A4]" />
            </div>
            <p className="text-[#49454F]">No tienes direcciones guardadas</p>
            <p className="text-[#79747E] text-sm mt-1">Añade una para agilizar tus compras.</p>
          </div>
        ) : (
          addresses.map((a) => (
            <div key={a.id} className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 min-w-0">
                  <MapPin className="w-5 h-5 text-[#6750A4] mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-[#1C1B1F] text-sm">{a.label || a.name}</p>
                      {a.is_default && (
                        <span className="text-[10px] font-bold text-[#1E7E34] bg-[#E6F4EA] px-2 py-0.5 rounded-full">Por defecto</span>
                      )}
                    </div>
                    <p className="text-sm text-[#49454F]">{a.name}</p>
                    <p className="text-sm text-[#49454F]">{a.address}, {a.postal_code} {a.city}</p>
                    {a.phone && <p className="text-xs text-[#79747E]">{a.phone}</p>}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button onClick={() => openEdit(a)} className="w-9 h-9 rounded-full bg-[#E8DEF8] flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-[#6750A4]" />
                  </button>
                  <button onClick={() => remove(a.id)} className="w-9 h-9 rounded-full bg-[#FDECEA] flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-[#C5221F]" />
                  </button>
                </div>
              </div>
              {!a.is_default && (
                <button onClick={() => setDefault(a)} className="mt-3 flex items-center gap-1 text-sm text-[#6750A4] font-medium">
                  <Star className="w-4 h-4" /> Usar por defecto
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Sheet form */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[88vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{editingId ? "Editar dirección" : "Nueva dirección"}</SheetTitle>
          </SheetHeader>
          <div className="space-y-3 mt-4 px-1">
            <input className={inputCls} placeholder="Etiqueta (Casa, Trabajo...)" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
            <input className={inputCls} placeholder="Nombre completo *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <input className={inputCls} placeholder="Teléfono" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className={inputCls} placeholder="Dirección (calle, nº, piso) *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Ciudad *" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              <input className={inputCls} placeholder="Código postal *" value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} />
            </div>
            <label className="flex items-center justify-between py-1 cursor-pointer">
              <span className="text-sm text-[#1C1B1F]">Usar como predeterminada</span>
              <button
                type="button"
                onClick={() => setForm({ ...form, is_default: !form.is_default })}
                className={`rounded-full relative h-5 w-[38px] ${form.is_default ? "bg-[#6750A4]" : "bg-[#79747E]"}`}
              >
                <span className={`bg-white rounded-full absolute top-1 transition-transform h-3 w-3 ${form.is_default ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </label>
            <Button onClick={save} disabled={saving} className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 font-semibold disabled:opacity-50">
              {saving ? "Guardando..." : "Guardar dirección"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
