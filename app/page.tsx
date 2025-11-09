"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function WelcomePage() {
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
          <div className="bg-[#6750A4] rounded-3xl flex items-center justify-center shadow-lg size-20">
            <svg
              className="w-16 h-16 text-white mx-0 mt-2.5"
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
          <h1 className="font-bold text-[#1C1B1F] text-center text-2xl">Adoptapp</h1>
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
