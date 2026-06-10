"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Truck, Check, ShieldCheck, Ticket, Lock } from "lucide-react"
import { SHIPPING_METHODS, shippingCost, FREE_SHIPPING_THRESHOLD } from "@/lib/shipping"
import { validateCoupon, type CouponRow } from "@/lib/coupon"

interface CartLine {
  id: string
  quantity: number
  product: { id: string; name: string; price: number; image_url: string | null; stock: number } | null
}

const inputCls =
  "w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"

const STEPS = ["Envío", "Resumen", "Pago"]

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [lines, setLines] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(true)
  const [placing, setPlacing] = useState(false)

  const [ship, setShip] = useState({ name: "", email: "", phone: "", address: "", city: "", postal_code: "" })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [method, setMethod] = useState("standard")

  const [couponInput, setCouponInput] = useState("")
  const [coupon, setCoupon] = useState<CouponRow | null>(null)
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null)

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
      const { data } = await supabase
        .from("cart_items")
        .select("id, quantity, product:shop_products(id, name, price, image_url, stock)")
        .eq("user_id", user.id)
      const rows = (data as unknown as CartLine[]) || []
      if (rows.length === 0) {
        router.replace("/tienda/carrito")
        return
      }
      setLines(rows)
      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name, email, phone, address, city, postal_code")
        .eq("id", user.id)
        .maybeSingle()
      if (profile) {
        setShip({
          name: profile.display_name || "",
          email: profile.email || user.email || "",
          phone: profile.phone || "",
          address: profile.address || "",
          city: profile.city || "",
          postal_code: profile.postal_code || "",
        })
      }
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const subtotal = lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.quantity : 0), 0)
  const discount = coupon ? validateCoupon(coupon, subtotal).discount : 0
  const afterDiscount = Math.max(0, subtotal - discount)
  const shipCost = shippingCost(method, afterDiscount)
  const total = afterDiscount + shipCost

  function validateShipping() {
    const e: Record<string, string> = {}
    if (!ship.name.trim()) e.name = "Indica tu nombre"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ship.email)) e.email = "Email no válido"
    if (!ship.phone.trim()) e.phone = "Indica un teléfono"
    if (!ship.address.trim()) e.address = "Indica la dirección"
    if (!ship.city.trim()) e.city = "Indica la ciudad"
    if (!/^\d{4,5}$/.test(ship.postal_code)) e.postal_code = "Código postal no válido"
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function applyCoupon() {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    const supabase = createClient()
    const { data } = await supabase.from("coupons").select("*").eq("code", code).maybeSingle()
    const r = validateCoupon(data as CouponRow | null, subtotal)
    if (r.ok) {
      setCoupon(data as CouponRow)
      setCouponMsg({ text: `Cupón aplicado: −${r.discount.toFixed(2)}€`, ok: true })
    } else {
      setCoupon(null)
      setCouponMsg({ text: r.reason || "Cupón no válido", ok: false })
    }
  }

  async function pay() {
    setPlacing(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("profiles")
          .update({ phone: ship.phone || null, address: ship.address || null, city: ship.city || null, postal_code: ship.postal_code || null })
          .eq("id", user.id)
      }
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping: ship, couponCode: coupon?.code || null, shippingMethod: method }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al iniciar el pago")
      window.dispatchEvent(new Event("cart-updated"))
      if (data.url) {
        window.location.href = data.url
      } else {
        router.push(`/tienda/pedido-ok?order=${data.orderId}`)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al procesar el pago")
      setPlacing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      {/* Stepper */}
      <div className="px-4 py-3 bg-[#FFFBFE] shadow-sm flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 ${i <= step ? "text-[#6750A4]" : "text-[#79747E]"}`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? "bg-[#6750A4] text-white" : i === step ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"}`}>
                {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              <span className="text-xs font-medium">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`w-5 h-0.5 ${i < step ? "bg-[#6750A4]" : "bg-[#E8DEF8]"}`} />}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {/* PASO 1: ENVÍO */}
        {step === 0 && (
          <div className="space-y-3">
            <h2 className="font-bold text-[#1C1B1F]">Datos de envío</h2>
            {(
              [
                { k: "name", ph: "Nombre completo", type: "text" },
                { k: "email", ph: "Email", type: "email" },
                { k: "phone", ph: "Teléfono", type: "tel" },
                { k: "address", ph: "Dirección (calle, nº, piso)", type: "text" },
              ] as const
            ).map((f) => (
              <div key={f.k}>
                <input
                  className={`${inputCls} ${errors[f.k] ? "border-[#C5221F]" : ""}`}
                  placeholder={f.ph}
                  type={f.type}
                  value={(ship as any)[f.k]}
                  onChange={(e) => setShip({ ...ship, [f.k]: e.target.value })}
                />
                {errors[f.k] && <p className="text-xs text-[#C5221F] mt-1 ml-1">{errors[f.k]}</p>}
              </div>
            ))}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input className={`${inputCls} ${errors.city ? "border-[#C5221F]" : ""}`} placeholder="Ciudad" value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} />
                {errors.city && <p className="text-xs text-[#C5221F] mt-1 ml-1">{errors.city}</p>}
              </div>
              <div>
                <input className={`${inputCls} ${errors.postal_code ? "border-[#C5221F]" : ""}`} placeholder="Código postal" value={ship.postal_code} onChange={(e) => setShip({ ...ship, postal_code: e.target.value })} />
                {errors.postal_code && <p className="text-xs text-[#C5221F] mt-1 ml-1">{errors.postal_code}</p>}
              </div>
            </div>

            <h2 className="font-bold text-[#1C1B1F] pt-3">Método de envío</h2>
            {SHIPPING_METHODS.map((m) => {
              const cost = shippingCost(m.id, afterDiscount)
              return (
                <button
                  key={m.id}
                  onClick={() => setMethod(m.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-colors ${method === m.id ? "border-[#6750A4] bg-[#E8DEF8]" : "border-[#E8DEF8] bg-[#FFFBFE]"}`}
                >
                  <Truck className="w-5 h-5 text-[#6750A4] flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-[#1C1B1F]">{m.label}</p>
                    <p className="text-xs text-[#79747E]">{m.detail}</p>
                  </div>
                  <span className={`font-bold text-sm ${cost === 0 ? "text-[#1E7E34]" : "text-[#6750A4]"}`}>
                    {cost === 0 ? "Gratis" : `${cost.toFixed(2)}€`}
                  </span>
                </button>
              )
            })}
            {afterDiscount < FREE_SHIPPING_THRESHOLD && (
              <p className="text-xs text-[#79747E]">Envío estándar gratis a partir de {FREE_SHIPPING_THRESHOLD}€.</p>
            )}
          </div>
        )}

        {/* PASO 2: RESUMEN */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="bg-[#FFFBFE] rounded-3xl p-4 shadow-md">
              <h2 className="font-bold text-[#1C1B1F] mb-3">Tu pedido</h2>
              <div className="space-y-2">
                {lines.map((l) => (
                  <div key={l.id} className="flex items-center gap-3">
                    <img src={l.product?.image_url || "/placeholder.svg"} alt="" className="w-12 h-12 rounded-xl object-cover bg-[#E8DEF8]" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#1C1B1F] line-clamp-1">{l.product?.name}</p>
                      <p className="text-xs text-[#79747E]">{l.quantity} × {l.product?.price.toFixed(2)}€</p>
                    </div>
                    <span className="text-sm font-medium">{((l.product?.price || 0) * l.quantity).toFixed(2)}€</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cupón */}
            <div className="bg-[#FFFBFE] rounded-3xl p-4 shadow-md">
              <p className="text-sm font-medium text-[#49454F] mb-2 flex items-center gap-2">
                <Ticket className="w-4 h-4 text-[#6750A4]" /> Cupón de descuento
              </p>
              <div className="flex gap-2">
                <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)} placeholder="CÓDIGO" className={`${inputCls} uppercase`} />
                <Button onClick={applyCoupon} className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-2xl px-5">Aplicar</Button>
              </div>
              {couponMsg && <p className={`text-xs mt-2 ${couponMsg.ok ? "text-[#1E7E34]" : "text-[#C5221F]"}`}>{couponMsg.text}</p>}
            </div>

            <div className="bg-[#FFFBFE] rounded-3xl p-4 shadow-md text-sm space-y-1">
              <div className="flex justify-between text-[#49454F]"><span>Subtotal</span><span>{subtotal.toFixed(2)}€</span></div>
              {discount > 0 && <div className="flex justify-between text-[#1E7E34]"><span>Descuento</span><span>−{discount.toFixed(2)}€</span></div>}
              <div className="flex justify-between text-[#49454F]"><span>Envío</span><span>{shipCost === 0 ? "Gratis" : `${shipCost.toFixed(2)}€`}</span></div>
              <div className="flex justify-between font-bold text-[#1C1B1F] text-base pt-2 border-t border-[#E8DEF8] mt-2"><span>Total</span><span className="text-[#6750A4]">{total.toFixed(2)}€</span></div>
            </div>
          </div>
        )}

        {/* PASO 3: PAGO */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="bg-[#FFFBFE] rounded-3xl p-4 shadow-md">
              <p className="text-sm text-[#49454F] mb-1">Enviar a</p>
              <p className="text-sm text-[#1C1B1F]">{ship.name} · {ship.address}, {ship.postal_code} {ship.city}</p>
              <button onClick={() => setStep(0)} className="text-xs text-[#6750A4] font-medium mt-1">Editar</button>
            </div>

            <div className="bg-[#FFFBFE] rounded-3xl p-4 shadow-md">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-[#1E7E34]" />
                <span className="text-sm font-medium text-[#1C1B1F]">Pago 100% seguro</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {["Visa", "Mastercard", "Amex", "Apple Pay", "Google Pay"].map((p) => (
                  <span key={p} className="text-[11px] font-semibold text-[#49454F] bg-[#F5F5F5] px-2.5 py-1 rounded-lg">{p}</span>
                ))}
              </div>
              <p className="text-xs text-[#79747E] mt-3 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5" /> Procesado de forma segura. No guardamos los datos de tu tarjeta.
              </p>
            </div>

            <div className="bg-[#FFFBFE] rounded-3xl p-4 shadow-md text-sm space-y-1">
              <div className="flex justify-between text-[#49454F]"><span>Subtotal</span><span>{subtotal.toFixed(2)}€</span></div>
              {discount > 0 && <div className="flex justify-between text-[#1E7E34]"><span>Descuento</span><span>−{discount.toFixed(2)}€</span></div>}
              <div className="flex justify-between text-[#49454F]"><span>Envío</span><span>{shipCost === 0 ? "Gratis" : `${shipCost.toFixed(2)}€`}</span></div>
              <div className="flex justify-between font-bold text-[#1C1B1F] text-base pt-2 border-t border-[#E8DEF8] mt-2"><span>Total a pagar</span><span className="text-[#6750A4]">{total.toFixed(2)}€</span></div>
            </div>
          </div>
        )}
      </div>

      {/* Footer acciones */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-[#FFFBFE] shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-[1998] flex gap-2">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="border-[#79747E] text-[#49454F] rounded-full h-12 px-6 bg-transparent">
            Atrás
          </Button>
        )}
        {step < 2 ? (
          <Button
            onClick={() => {
              if (step === 0 && !validateShipping()) return
              setStep((s) => s + 1)
            }}
            className="flex-1 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold"
          >
            Continuar
          </Button>
        ) : (
          <Button onClick={pay} disabled={placing} className="flex-1 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold disabled:opacity-50">
            {placing ? "Procesando..." : `Pagar ${total.toFixed(2)}€`}
          </Button>
        )}
      </div>
    </div>
  )
}
