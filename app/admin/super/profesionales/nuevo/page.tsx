"use client"

import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { ProfessionalForm } from "@/components/professional-form"

export default function NuevoProfesionalPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/admin/super/profesionales"
          className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF]"
        >
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-base">Nuevo profesional</h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <ProfessionalForm />
      </div>
    </div>
  )
}
