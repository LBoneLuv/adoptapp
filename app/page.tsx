"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

export default function WelcomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkSession = async () => {
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (session?.user) {
        // Check if user is a shelter
        const { data: shelterData } = await supabase.from("shelters").select("id").eq("id", session.user.id).single()

        if (shelterData) {
          router.push("/admin/animales")
        } else {
          router.push("/principal")
        }
      } else {
        setIsChecking(false)
      }
    }

    checkSession()
  }, [router])

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]"></div>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col items-center justify-between min-h-screen bg-[#FEF7FF] px-6 py-12">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/puppies-playing-background.jpg"
          alt="Puppies playing"
          className="w-full h-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#FEF7FF]/80 via-[#FEF7FF]/90 to-[#FEF7FF]" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between flex-1 w-full max-w-md">
        {/* Logo and Slogan */}
        <div className="flex flex-col items-center gap-4 mt-16">
          <img src="/arko-full-logo.svg" alt="Arko" className="h-32 w-auto" />
          <p className="text-[#49454F] text-center font-medium text-base">Encuentra a tu nuevo mejor amigo</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-full mb-8">
          <Link href="/registro" className="w-full">
            <Button className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full font-semibold shadow-lg text-base h-11">
              Quiero Adoptar
            </Button>
          </Link>
          <Link href="/registro-protectora" className="w-full">
            <Button
              variant="outline"
              className="w-full border-2 border-[#6750A4] text-[#6750A4] hover:bg-[#E8DEF8] rounded-full font-semibold bg-transparent text-base h-11"
            >
              Soy una Protectora
            </Button>
          </Link>
        </div>

        <div className="mb-8">
          <p className="text-[#49454F] text-center text-sm">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-[#6750A4] font-semibold hover:underline">
              Inicia Sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
