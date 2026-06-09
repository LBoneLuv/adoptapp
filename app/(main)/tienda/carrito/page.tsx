"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Check } from "lucide-react"

interface CartLine {
  id: string
  quantity: number
  product: {
    id: string
    name: string
    price: number
    image_url: string | null
    stock: number
  } | null
}

const inputCls =
  "w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"

export default function CarritoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [lines, setLines] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(true)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [placing, setPlacing] = useState(false)
  const success = searchParams.get("success") === "1"

  const [ship, setShip] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  })

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
      .from("cart_items")
      .select("id, quantity, product:shop_products(id, name, price, image_url, stock)")
      .eq("user_id", user.id)
    setLines((data as unknown as CartLine[]) || [])

    // Prefill shipping from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email, phone, address, city, postal_code")
      .eq("id", user.id)
      .maybeSingle()
    if (profile) {
      setShip((s) => ({
        ...s,
        name: profile.display_name || "",
        email: profile.email || user.email || "",
        phone: profile.phone || "",
        address: profile.address || "",
        city: profile.city || "",
        postal_code: profile.postal_code || "",
      }))
    }
    setLoading(false)
  }

  async function updateQty(line: CartLine, delta: number) {
    if (!line.product) return
    const newQty = Math.max(1, Math.min(line.product.stock, line.quantity + delta))
    if (newQty === line.quantity) return
    setLines((ls) => ls.map((l) => (l.id === line.id ? { ...l, quantity: newQty } : l)))
    const supabase = createClient()
    await supabase.from("cart_items").update({ quantity: newQty }).eq("id", line.id)
  }

  async function removeLine(id: string) {
    setLines((ls) => ls.filter((l) => l.id !== id))
    const supabase = createClient()
    await supabase.from("cart_items").delete().eq("id", id)
  }

  const total = lines.reduce((sum, l) => sum + (l.product ? l.product.price * l.quantity : 0), 0)

  async function checkout() {
    if (!ship.name || !ship.email || !ship.address || !ship.city || !ship.postal_code) {
      alert("Completa todos los datos de envío")
      return
    }
    setPlacing(true)
    try {
      // Guardar los datos de envío en el perfil para autocompletar en futuras compras
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from("profiles")
          .update({
            phone: ship.phone || null,
            address: ship.address || null,
            city: ship.city || null,
            postal_code: ship.postal_code || null,
          })
          .eq("id", user.id)
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipping: ship }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al iniciar el pago")

      if (data.url) {
        // Stripe Checkout
        window.location.href = data.url
      } else {
        // Stripe no configurado: pedido creado en modo manual
        router.push("/tienda/carrito?success=1")
        router.refresh()
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al procesar el pago")
      setPlacing(false)
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FEF7FF] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#E6F4EA] flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-[#1E7E34]" />
        </div>
        <h1 className="text-xl font-bold text-[#1C1B1F]">¡Pedido realizado!</h1>
        <p className="text-[#49454F] mt-2">Gracias por tu compra. Recibirás la confirmación por email.</p>
        <Link href="/tienda" className="mt-6">
          <Button className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 px-8">
            Seguir comprando
          </Button>
        </Link>
      </div>
    )
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
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 text-[#6750A4]" />
        </Button>
        <h1 className="font-bold text-[#1C1B1F] text-base">Mi carrito</h1>
      </header>

      {lines.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
          <div className="w-16 h-16 rounded-full bg-[#E8DEF8] flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-[#6750A4]" />
          </div>
          <p className="text-[#49454F]">Tu carrito está vacío</p>
          <Link href="/tienda" className="mt-4">
            <Button variant="outline" className="rounded-full border-[#6750A4] text-[#6750A4]">
              Ir a la tienda
            </Button>
          </Link>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-44">
            {lines.map((line) => (
              <div key={line.id} className="bg-[#FFFBFE] rounded-3xl p-3 flex items-center gap-3 shadow-md">
                <img
                  src={line.product?.image_url || "/placeholder.svg"}
                  alt={line.product?.name || ""}
                  className="w-20 h-20 rounded-2xl object-cover bg-white flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm text-[#1C1B1F] line-clamp-2">{line.product?.name}</h3>
                  <p className="font-bold text-[#6750A4] mt-1">
                    {((line.product?.price || 0) * line.quantity).toFixed(2)}€
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-2 bg-[#F5F5F5] rounded-full p-0.5">
                      <button
                        onClick={() => updateQty(line, -1)}
                        className="w-7 h-7 rounded-full bg-[#E8DEF8] flex items-center justify-center"
                      >
                        <Minus className="w-3.5 h-3.5 text-[#6750A4]" />
                      </button>
                      <span className="w-5 text-center text-sm font-semibold">{line.quantity}</span>
                      <button
                        onClick={() => updateQty(line, 1)}
                        className="w-7 h-7 rounded-full bg-[#E8DEF8] flex items-center justify-center"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#6750A4]" />
                      </button>
                    </div>
                    <button
                      onClick={() => removeLine(line.id)}
                      className="w-8 h-8 rounded-full bg-[#FDECEA] flex items-center justify-center ml-auto"
                    >
                      <Trash2 className="w-4 h-4 text-[#C5221F]" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Total + checkout */}
          <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-[#FFFBFE] shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-[1998]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#49454F]">Total</span>
              <span className="text-xl font-bold text-[#1C1B1F]">{total.toFixed(2)}€</span>
            </div>
            <Button
              onClick={() => setCheckoutOpen(true)}
              className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold"
            >
              Finalizar compra
            </Button>
          </div>
        </>
      )}

      {/* Checkout sheet */}
      <Sheet open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Datos de envío</SheetTitle>
            <SheetDescription>Completa tus datos para finalizar el pedido</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 mt-4 px-1">
            <input className={inputCls} placeholder="Nombre completo" value={ship.name} onChange={(e) => setShip({ ...ship, name: e.target.value })} />
            <input className={inputCls} placeholder="Email" type="email" value={ship.email} onChange={(e) => setShip({ ...ship, email: e.target.value })} />
            <input className={inputCls} placeholder="Teléfono" value={ship.phone} onChange={(e) => setShip({ ...ship, phone: e.target.value })} />
            <input className={inputCls} placeholder="Dirección" value={ship.address} onChange={(e) => setShip({ ...ship, address: e.target.value })} />
            <div className="grid grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Ciudad" value={ship.city} onChange={(e) => setShip({ ...ship, city: e.target.value })} />
              <input className={inputCls} placeholder="Código postal" value={ship.postal_code} onChange={(e) => setShip({ ...ship, postal_code: e.target.value })} />
            </div>
            <div className="flex items-center justify-between pt-2">
              <span className="text-[#49454F]">Total a pagar</span>
              <span className="text-xl font-bold text-[#1C1B1F]">{total.toFixed(2)}€</span>
            </div>
            <Button
              onClick={checkout}
              disabled={placing}
              className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold disabled:opacity-50"
            >
              {placing ? "Procesando..." : "Pagar"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
