"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { ProfessionalForm } from "@/components/professional-form"
import type { Professional } from "@/lib/professionals-config"

export default function EditarProfesionalPage() {
  const params = useParams()
  const id = params?.id as string
  const [professional, setProfessional] = useState<Professional | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase
      .from("professionals")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        setProfessional(data as Professional)
        setLoading(false)
      })
  }, [id])

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm flex items-center gap-3 sticky top-0 z-10">
        <Link
          href="/admin/super/profesionales"
          className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF]"
        >
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-base line-clamp-1">
          {professional ? `Editar: ${professional.name}` : "Editar profesional"}
        </h1>
      </header>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6750A4]" />
          </div>
        ) : professional ? (
          <ProfessionalForm initial={professional} />
        ) : (
          <p className="text-center text-[#79747E] py-12">No se encontró el profesional.</p>
        )}
      </div>
    </div>
  )
}
