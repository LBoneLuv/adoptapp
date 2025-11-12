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
          const { data } = await supabase.from("shelters").select("id").eq("id", user.id).maybeSingle()
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
          href="/principal"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/principal") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <img src="/arko-logo.svg" alt="Arko" className="w-6 h-6" />
          <span className="text-xs font-medium">Arko</span>
        </Link>

        <Link
          href="/servicios"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/servicios") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span className="text-xs font-medium">Servicios</span>
        </Link>

        <Link
          href="/favoritos"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/favoritos") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span className="text-xs font-medium">Favoritos</span>
        </Link>

        <Link
          href="/mis-animales"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/mis-animales") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
            <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
            <ellipse cx="5" cy="10" rx="2" ry="2.5" />
            <ellipse cx="19" cy="10" rx="2" ry="2.5" />
            <path d="M12 10c-2.5 0-4.5 1.5-5 4-.3 1.5.5 3 2 3.5 1 .3 2 .5 3 .5s2-.2 3-.5c1.5-.5 2.3-2 2-3.5-.5-2.5-2.5-4-5-4z" />
          </svg>
          <span className="text-xs font-medium">Mis animales</span>
        </Link>

        <Link
          href="/tienda"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/tienda") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z" />
          </svg>
          <span className="text-xs font-medium">Tienda</span>
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
