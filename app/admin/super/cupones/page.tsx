"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Plus, Trash2, Ticket } from "lucide-react"

interface Coupon {
  id: string
  code: string
  discount_type: "percent" | "fixed"
  discount_value: number
  min_order: number | null
  active: boolean
  expires_at: string | null
  usage_limit: number | null
  used_count: number
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

export default function CuponesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ code: "", discount_type: "percent", discount_value: "", min_order: "", usage_limit: "", expires_at: "" })

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
      const { data: sh } = await supabase.from("shelters").select("role").eq("id", user.id).maybeSingle()
      if (profile?.role !== "super_admin" && sh?.role !== "super_admin") {
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
    const { data } = await supabase.from("coupons").select("*").order("created_at", { ascending: false })
    setCoupons((data as Coupon[]) || [])
  }

  async function create() {
    if (!form.code || !form.discount_value) {
      toast("✗ Código y valor son obligatorios", false)
      return
    }
    const supabase = createClient()
    const { error } = await supabase.from("coupons").insert({
      code: form.code.trim().toUpperCase(),
      discount_type: form.discount_type,
      discount_value: Number.parseFloat(form.discount_value),
      min_order: form.min_order ? Number.parseFloat(form.min_order) : 0,
      usage_limit: form.usage_limit ? Number.parseInt(form.usage_limit, 10) : null,
      expires_at: form.expires_at || null,
      active: true,
    })
    if (error) {
      toast(error.code === "23505" ? "✗ Ese código ya existe" : "✗ Error al crear", false)
      return
    }
    toast("✓ Cupón creado")
    setForm({ code: "", discount_type: "percent", discount_value: "", min_order: "", usage_limit: "", expires_at: "" })
    setShowForm(false)
    await load()
  }

  async function toggleActive(c: Coupon) {
    const supabase = createClient()
    await supabase.from("coupons").update({ active: !c.active }).eq("id", c.id)
    setCoupons((cs) => cs.map((x) => (x.id === c.id ? { ...x, active: !x.active } : x)))
  }

  async function remove(id: string, code: string) {
    if (!confirm(`¿Eliminar el cupón ${code}?`)) return
    const supabase = createClient()
    const { error } = await supabase.from("coupons").delete().eq("id", id)
    if (error) {
      toast("✗ Error al eliminar", false)
      return
    }
    setCoupons((cs) => cs.filter((x) => x.id !== id))
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
          <Link href="/admin/super" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
            <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
          </Link>
          <h1 className="font-bold text-[#1C1B1F] text-lg">Cupones</h1>
        </div>
        <Button onClick={() => setShowForm((s) => !s)} className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-10">
          <Plus className="w-4 h-4 mr-1" /> Nuevo
        </Button>
      </header>

      {showForm && (
        <div className="mx-4 mt-3 bg-[#FFFBFE] rounded-3xl shadow-md p-4 space-y-3">
          <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="CÓDIGO (ej: VERANO10)" className={`${inputCls} uppercase`} />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.discount_type} onChange={(e) => setForm({ ...form, discount_type: e.target.value })} className={inputCls}>
              <option value="percent">% Porcentaje</option>
              <option value="fixed">€ Fijo</option>
            </select>
            <input type="number" min="0" step="0.01" value={form.discount_value} onChange={(e) => setForm({ ...form, discount_value: e.target.value })} placeholder={form.discount_type === "percent" ? "Ej: 10 (%)" : "Ej: 5 (€)"} className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input type="number" min="0" step="0.01" value={form.min_order} onChange={(e) => setForm({ ...form, min_order: e.target.value })} placeholder="Pedido mínimo €" className={inputCls} />
            <input type="number" min="1" value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: e.target.value })} placeholder="Límite de usos" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-[#79747E]">Caduca (opcional)</label>
            <input type="date" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className={inputCls} />
          </div>
          <Button onClick={create} className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-10 font-semibold">
            Crear cupón
          </Button>
        </div>
      )}

      <div className="px-4 py-3 space-y-3">
        {coupons.length === 0 ? (
          <div className="text-center py-12">
            <Ticket className="w-12 h-12 text-[#D0BCFF] mx-auto mb-2" />
            <p className="text-[#79747E]">No hay cupones. Crea el primero.</p>
          </div>
        ) : (
          coupons.map((c) => (
            <div key={c.id} className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#1C1B1F] text-lg tracking-wide">{c.code}</p>
                  <p className="text-sm text-[#6750A4] font-semibold">
                    {c.discount_type === "percent" ? `${c.discount_value}% de descuento` : `${c.discount_value.toFixed(2)}€ de descuento`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(c)} className="flex items-center gap-2">
                    <span className={`rounded-full relative h-5 w-[38px] ${c.active ? "bg-[#6750A4]" : "bg-[#79747E]"}`}>
                      <span className={`bg-white rounded-full absolute top-1 transition-transform h-3 w-3 ${c.active ? "translate-x-6" : "translate-x-1"}`} />
                    </span>
                  </button>
                  <button onClick={() => remove(c.id, c.code)} className="w-9 h-9 rounded-full bg-[#FDECEA] flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-[#C5221F]" />
                  </button>
                </div>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-[#79747E]">
                {c.min_order ? <span>Pedido mín. {c.min_order.toFixed(2)}€</span> : null}
                <span>Usos: {c.used_count}{c.usage_limit ? `/${c.usage_limit}` : ""}</span>
                {c.expires_at && <span>Caduca {new Date(c.expires_at).toLocaleDateString()}</span>}
                {!c.active && <span className="text-[#C5221F] font-medium">Inactivo</span>}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
