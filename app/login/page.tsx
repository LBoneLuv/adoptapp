"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const [activeTab, setActiveTab] = useState<"usuario" | "protectora">("usuario")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) throw authError

      // Check if user is a shelter or regular user
      if (data.user) {
        const { data: shelterData } = await supabase.from("shelters").select("id").eq("id", data.user.id).single()

        if (shelterData) {
          router.push("/admin/animales")
        } else {
          router.push("/adopta")
        }
      }
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "Error al iniciar sesión")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 bg-[#FFFBFE] shadow-sm">
        <Link href="/bienvenida" className="w-10 h-10 flex items-center justify-center">
          <ArrowLeft className="w-6 h-6 text-[#1C1B1F]" />
        </Link>
        <div className="flex-1 flex justify-center">
          <div className="w-12 h-12 bg-[#6750A4] rounded-2xl flex items-center justify-center">
            <svg
              className="w-8 h-8 text-white"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
              <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
              <ellipse cx="5" cy="10" rx="2" ry="2.5" />
              <ellipse cx="19" cy="10" rx="2" ry="2.5" />
              <path d="M12 10c-2.5 0-4.5 1.5-5 4-.3 1.5.5 3 2 3.5 1 .3 2 .5 3 .5s2-.2 3-.5c1.5-.5 2.3-2 2-3.5-.5-2.5-2.5-4-5-4z" />
            </svg>
          </div>
        </div>
        <div className="w-10" />
      </header>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        <div className="max-w-md mx-auto">
          {/* Role Tabs */}
          <div className="flex bg-[#E8DEF8] rounded-full p-1 mb-8">
            <button
              onClick={() => setActiveTab("usuario")}
              className={`flex-1 py-3 px-6 rounded-full text-sm font-semibold transition-all ${
                activeTab === "usuario"
                  ? "bg-[#6750A4] text-white shadow-md"
                  : "bg-transparent text-[#6750A4] hover:bg-[#D0BCFF]/30"
              }`}
            >
              Usuario
            </button>
            <button
              onClick={() => setActiveTab("protectora")}
              className={`flex-1 py-3 px-6 rounded-full text-sm font-semibold transition-all ${
                activeTab === "protectora"
                  ? "bg-[#6750A4] text-white shadow-md"
                  : "bg-transparent text-[#6750A4] hover:bg-[#D0BCFF]/30"
              }`}
            >
              Protectora
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
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
                className="w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl h-14 px-4 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8]"
              />
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-[#1C1B1F] block">
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full bg-[#FFFBFE] border-[#79747E] rounded-2xl h-14 px-4 pr-12 text-[#1C1B1F] focus:border-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#79747E] hover:text-[#6750A4] transition-colors"
                >
                  {showPassword ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                </button>
              </div>
              <div className="flex items-center justify-between">
                <label htmlFor="remember" className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#79747E] text-[#6750A4] focus:ring-2 focus:ring-[#E8DEF8] cursor-pointer"
                  />
                  <span className="text-sm text-[#49454F]">Recordar</span>
                </label>
                <Link href="#" className="text-sm text-[#6750A4] hover:underline">
                  He olvidado mi contraseña
                </Link>
              </div>
            </div>

            {/* Error Message Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl text-sm">{error}</div>
            )}

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-14 text-base font-semibold shadow-lg disabled:opacity-50"
            >
              {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-8 text-center">
            <p className="text-[#49454F]">
              ¿No tienes cuenta?{" "}
              <Link href="/registro" className="text-[#6750A4] font-semibold hover:underline">
                Regístrate
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
