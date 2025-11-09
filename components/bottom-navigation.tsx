"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function BottomNavigation() {
  const pathname = usePathname()
  const [isShelter, setIsShelter] = useState(false)

  useEffect(() => {
    async function checkIfShelter() {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const { data } = await supabase.from("shelters").select("id").eq("id", user.id).single()
          setIsShelter(!!data)
        }
      } catch (error) {
        console.error("Error checking shelter status:", error)
      }
    }

    checkIfShelter()
  }, [])

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#FFFBFE] py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-[2000]">
      <div className="flex items-center justify-between">
        <Link
          href="/adopta"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/adopta") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
            <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
            <ellipse cx="5" cy="10" rx="2" ry="2.5" />
            <ellipse cx="19" cy="10" rx="2" ry="2.5" />
            <path d="M12 10c-2.5 0-4.5 1.5-5 4-.3 1.5.5 3 2 3.5 1 .3 2 .5 3 .5s2-.2 3-.5c1.5-.5 2.3-2 2-3.5-.5-2.5-2.5-4-5-4z" />
          </svg>
          <span className="text-xs font-medium">Adopta</span>
        </Link>

        <Link
          href="/protectoras"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/protectoras") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 3l-10 9h3v9h6v-6h2v6h6v-9h3l-10-9z" />
            <path
              d="M12 8c-.8 0-1.5.4-1.9 1-.4-.6-1.1-1-1.9-1-.8 0-1.5.4-1.9 1-.3.4-.3.9-.3 1.3 0 1.5 1.5 2.7 3.5 4.5.3.3.8.3 1.1 0 2-1.8 3.5-3 3.5-4.5 0-.4 0-.9-.3-1.3-.5-.6-1.2-1-2-1z"
              fill="#FFFBFE"
            />
          </svg>
          <span className="text-xs font-medium">Protectoras</span>
        </Link>

        <Link
          href="/avisos"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/avisos") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <span className="text-xs font-medium">Avisos</span>
        </Link>

        <Link
          href="/comunidad"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/comunidad") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2h14z" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <span className="text-xs font-medium">Comunidad</span>
        </Link>

        {isShelter && (
          <Link
            href="/admin/animales"
            className="flex flex-col items-center gap-1 py-2 flex-1 text-[#D0BCFF] hover:text-[#6750A4] transition-colors"
          >
            <svg
              className="w-6 h-6"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <span className="text-xs font-medium">Admin</span>
          </Link>
        )}
      </div>
    </nav>
  )
}
