"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { User, Package, Heart, MessageSquare, LogOut, ChevronRight, Coffee, Check, MapPin } from "lucide-react"

const DONATION_AMOUNTS = [3, 5, 10, 20]

export default function PerfilPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [profile, setProfile] = useState<{ display_name: string; email: string; avatar_url: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [donateOpen, setDonateOpen] = useState(false)
  const [amount, setAmount] = useState(5)
  const [customAmount, setCustomAmount] = useState("")
  const [donating, setDonating] = useState(false)
  const [donatedOk, setDonatedOk] = useState(searchParams.get("donated") === "1")

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
      const { data } = await supabase.from("profiles").select("display_name, email, avatar_url").eq("id", user.id).maybeSingle()
      setProfile({
        display_name: data?.display_name || "",
        email: data?.email || user.email || "",
        avatar_url: data?.avatar_url || "",
      })
      setLoading(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  async function donate() {
    const amt = customAmount ? Number.parseFloat(customAmount) : amount
    if (!amt || amt <= 0) {
      alert("Introduce un importe válido")
      return
    }
    setDonating(true)
    try {
      const res = await fetch("/api/creator-donation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: amt }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error")
      if (data.url) {
        window.location.href = data.url
      } else {
        setDonateOpen(false)
        setDonatedOk(true)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al procesar la donación")
      setDonating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  const menu = [
    { href: "/perfil/editar", label: "Editar perfil", desc: "Foto, nombre, teléfono…", icon: User },
    { href: "/perfil/direcciones", label: "Mis direcciones", desc: "Tu libreta de direcciones de envío", icon: MapPin },
    { href: "/tienda/pedidos", label: "Mis pedidos", desc: "Estado de tus compras", icon: Package },
    { href: "/favoritos", label: "Mis favoritos", desc: "Mascotas y productos guardados", icon: Heart },
    { href: "/perfil/sugerencias", label: "Sugerencias y mejoras", desc: "Cuéntanos ideas o errores", icon: MessageSquare },
  ]

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      <header className="flex items-center justify-between px-4 py-4 bg-[#FFFBFE] shadow-sm">
        <Link href="/principal" className="flex items-center gap-2">
          <img src="/arko-header-logo.svg" alt="Arko" className="h-10 w-auto" />
        </Link>
        <h2 className="font-semibold text-[#1C1B1F] text-sm">Mi cuenta</h2>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-md mx-auto">
          {/* Resumen */}
          <Link href="/perfil/editar" className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-[#E8DEF8] border-2 border-[#6750A4] flex items-center justify-center flex-shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-[#6750A4]">
                  {profile?.display_name?.[0] || profile?.email?.[0] || "U"}
                </span>
              )}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#1C1B1F] text-lg line-clamp-1">{profile?.display_name || "Usuario"}</p>
              <p className="text-sm text-[#79747E] line-clamp-1">{profile?.email}</p>
            </div>
          </Link>

          {donatedOk && (
            <div className="flex items-center gap-2 bg-[#E6F4EA] text-[#1E7E34] rounded-2xl px-4 py-3 text-sm font-medium mb-4">
              <Check className="w-5 h-5 flex-shrink-0" /> ¡Gracias por tu apoyo! 💜
            </div>
          )}

          {/* Menú */}
          <div className="space-y-2">
            {menu.map((m) => {
              const Icon = m.icon
              return (
                <Link key={m.href} href={m.href} className="flex items-center gap-3 bg-[#FFFBFE] rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-10 h-10 rounded-full bg-[#E8DEF8] flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-[#6750A4]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1C1B1F] text-sm">{m.label}</p>
                    <p className="text-xs text-[#79747E] line-clamp-1">{m.desc}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#79747E]" />
                </Link>
              )
            })}

            {/* Donar al creador */}
            <button onClick={() => setDonateOpen(true)} className="w-full flex items-center gap-3 bg-gradient-to-r from-[#6750A4] to-[#7965AF] rounded-2xl p-4 shadow-md">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <Coffee className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="font-semibold text-white text-sm">Invítame a un café ☕</p>
                <p className="text-xs text-white/80 line-clamp-1">Ayuda a mantener Arko y cubrir costes</p>
              </div>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </button>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            className="w-full mt-6 border-2 border-[#BA1A1A] text-[#BA1A1A] hover:bg-[#BA1A1A] hover:text-white rounded-full h-12 text-base font-semibold bg-transparent"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Cerrar sesión
          </Button>
        </div>
      </div>

      {/* Sheet donación */}
      <Sheet open={donateOpen} onOpenChange={setDonateOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Apoya a Arko 💜</SheetTitle>
            <SheetDescription>Tu aportación ayuda a mantener la app y cubrir costes.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4 px-1">
            <div className="grid grid-cols-4 gap-2">
              {DONATION_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setAmount(amt)
                    setCustomAmount("")
                  }}
                  className={`py-3 rounded-2xl font-semibold text-sm ${!customAmount && amount === amt ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"}`}
                >
                  {amt}€
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
              placeholder="Otro importe (€)"
              className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
            />
            <Button onClick={donate} disabled={donating} className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold disabled:opacity-50">
              <Coffee className="w-5 h-5 mr-2" />
              {donating ? "Procesando..." : `Donar ${customAmount || amount}€`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
