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

export default function RegistroPage() {
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

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
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/adopta`,
          data: {
            display_name: name,
            user_type: "user",
          },
        },
      })

      if (authError) throw authError

      router.push("/auth/check-email")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al crear la cuenta")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      {/* Header */}
      <header className="flex items-center px-4 py-4 bg-[#FFFBFE] shadow-sm">
        <Link href="/" className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-[#1C1B1F]" />
        </Link>
        <h1 className="flex-1 font-semibold text-[#1C1B1F] pr-10 text-base text-center">Crear Cuenta de Usuario</h1>
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* Form */}
          <form onSubmit={handleSignUp} className="space-y-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium text-[#1C1B1F] block">
                Tu Nombre
              </label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] text-sm h-11"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-[#1C1B1F] block">
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] text-sm h-11"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#1C1B1F] block">
                Contraseña
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] text-sm h-11"
              />
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-[#1C1B1F] block">
                Confirmar Contraseña
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] text-sm h-11"
              />
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start gap-3 pt-2">
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
                </Link>{" "}
                y la{" "}
                <Link href="#" className="text-[#6750A4] hover:underline">
                  Política de Privacidad
                </Link>
                .
              </label>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{error}</div>
            )}

            {/* Create Account Button */}
            <Button
              type="submit"
              disabled={isLoading || !acceptedTerms}
              className="w-full mt-8 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full text-base font-semibold shadow-lg h-11 disabled:opacity-50"
            >
              {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-[#49454F] text-sm">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="text-[#6750A4] font-semibold hover:underline">
                Inicia Sesión
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
