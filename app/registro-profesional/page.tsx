"use client"

import type React from "react"
import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { createClient } from "@/lib/supabase/client"
import { translateAuthError } from "@/lib/auth-errors"
import { PROFESSIONAL_TYPES, type ProfessionalType } from "@/lib/professionals-config"

const inputCls =
  "w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] text-sm h-11"

export default function RegistroProfesionalPage() {
  const router = useRouter()
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [name, setName] = useState("")
  const [type, setType] = useState<ProfessionalType>("veterinario")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [location, setLocation] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden")
      return
    }
    if (!acceptedTerms) {
      setError("Debes aceptar los términos y condiciones")
      return
    }

    const supabase = createClient()
    setIsLoading(true)
    try {
      const { error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo:
            process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/profesional/panel`,
          data: {
            name,
            phone,
            location,
            professional_type: type,
            user_type: "professional",
          },
        },
      })
      if (authError) throw authError
      router.push("/auth/check-email")
    } catch (error: unknown) {
      setError(translateAuthError(error))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      <header className="flex items-center px-4 py-4 bg-[#FFFBFE] shadow-sm">
        <Link href="/" className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-[#1C1B1F]" />
        </Link>
        <h1 className="flex-1 text-center font-semibold text-[#1C1B1F] pr-10 text-base">Registrar mi negocio</h1>
      </header>

      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          <p className="text-sm text-[#49454F] leading-relaxed mb-6 text-center">
            Da de alta tu servicio (veterinario, adiestrador, paseador o residencia). Revisaremos tu solicitud para
            publicarlo en el directorio.
          </p>

          <form onSubmit={handleSignUp} className="space-y-5">
            {/* Tipo de profesional */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1C1B1F] block">Tipo de servicio</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(PROFESSIONAL_TYPES).map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setType(t.type)}
                    className={`py-2.5 rounded-2xl text-sm font-medium transition-colors ${
                      type === t.type ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[#1C1B1F] block">
                Nombre del negocio / profesional
              </label>
              <Input id="name" type="text" placeholder="Clínica Veterinaria San Roque" value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
            </div>

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#1C1B1F] block">
                Correo electrónico de contacto
              </label>
              <Input id="email" type="email" placeholder="contacto@negocio.com" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
            </div>

            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium text-[#1C1B1F] block">
                Teléfono de contacto
              </label>
              <Input id="phone" type="tel" placeholder="+34 600 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} required className={inputCls} />
            </div>

            <div className="space-y-2">
              <label htmlFor="location" className="text-sm font-medium text-[#1C1B1F] block">
                Ubicación (Ciudad, Provincia)
              </label>
              <Input id="location" type="text" placeholder="Málaga, Málaga" value={location} onChange={(e) => setLocation(e.target.value)} required className={inputCls} />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#1C1B1F] block">
                Contraseña
              </label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className={inputCls} />
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#1C1B1F] block">
                Confirmar contraseña
              </label>
              <Input id="confirmPassword" type="password" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className={inputCls} />
            </div>

            <div className="flex items-start gap-3 pt-1">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked as boolean)}
                className="mt-1 border-[#79747E] data-[state=checked]:bg-[#6750A4] data-[state=checked]:border-[#6750A4]"
              />
              <label htmlFor="terms" className="text-sm text-[#49454F] leading-relaxed cursor-pointer">
                Acepto los{" "}
                <Link href="#" className="text-[#6750A4] hover:underline">
                  Términos y Condiciones
                </Link>
                .
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{error}</div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !acceptedTerms}
              className="w-full mt-4 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-14 text-base font-semibold shadow-lg disabled:opacity-50"
            >
              {isLoading ? "Enviando solicitud..." : "Enviar solicitud"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
