"use client"

import { useState } from "react"
import Link from "next/link"
import { ArrowLeft, Check, Lightbulb, Wrench, Bug } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const TYPES = [
  { id: "sugerencia", label: "Sugerencia", icon: Lightbulb },
  { id: "mejora", label: "Mejora", icon: Wrench },
  { id: "bug", label: "Error / bug", icon: Bug },
] as const

export default function SugerenciasPage() {
  const router = useRouter()
  const [type, setType] = useState<string>("sugerencia")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  async function submit() {
    if (!message.trim()) return
    setSending(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    const { data: profile } = await supabase.from("profiles").select("email").eq("id", user.id).maybeSingle()
    const { error } = await supabase.from("app_feedback").insert({
      user_id: user.id,
      type,
      message: message.trim(),
      email: profile?.email || user.email || null,
    })
    setSending(false)
    if (error) {
      alert("Error al enviar. Inténtalo de nuevo.")
      return
    }
    setSent(true)
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#FEF7FF] px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-[#E6F4EA] flex items-center justify-center mb-4">
          <Check className="w-10 h-10 text-[#1E7E34]" />
        </div>
        <h1 className="text-xl font-bold text-[#1C1B1F]">¡Gracias por tu feedback!</h1>
        <p className="text-[#49454F] mt-2">Lo tendremos muy en cuenta para mejorar Arko.</p>
        <Link href="/perfil" className="mt-6">
          <Button className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 px-8">Volver</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      <header className="flex items-center gap-3 px-4 py-4 bg-[#FFFBFE] shadow-sm sticky top-0 z-10">
        <Link href="/perfil" className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-base">Sugerencias y mejoras</h1>
      </header>

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        <p className="text-sm text-[#49454F] mb-5">
          ¿Tienes una idea, una mejora o has encontrado un fallo? Cuéntanoslo, leemos todo.
        </p>

        <div className="grid grid-cols-3 gap-2 mb-5">
          {TYPES.map((t) => {
            const Icon = t.icon
            const active = type === t.id
            return (
              <button
                key={t.id}
                onClick={() => setType(t.id)}
                className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 transition-colors ${
                  active ? "border-[#6750A4] bg-[#E8DEF8]" : "border-[#E8DEF8] bg-[#FFFBFE]"
                }`}
              >
                <Icon className={`w-5 h-5 ${active ? "text-[#6750A4]" : "text-[#79747E]"}`} />
                <span className={`text-xs font-medium ${active ? "text-[#6750A4]" : "text-[#49454F]"}`}>{t.label}</span>
              </button>
            )
          })}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={6}
          placeholder="Escribe aquí tu mensaje..."
          className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm resize-none"
        />

        <Button
          onClick={submit}
          disabled={sending || !message.trim()}
          className="w-full mt-5 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold disabled:opacity-50"
        >
          {sending ? "Enviando..." : "Enviar"}
        </Button>
      </div>
    </div>
  )
}
