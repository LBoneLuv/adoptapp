"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, MessageCircle, Building2 } from "lucide-react"

export function AdminBottomNavigation() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#FFFBFE] py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-[2000]">
      <div className="flex items-center justify-between">
        <Link
          href="/admin/animales"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/admin/animales") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
            <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
            <ellipse cx="5" cy="10" rx="2" ry="2.5" />
            <ellipse cx="19" cy="10" rx="2" ry="2.5" />
            <path d="M12 10c-2.5 0-4.5 1.5-5 4-.3 1.5.5 3 2 3.5 1 .3 2 .5 3 .5s2-.2 3-.5c1.5-.5 2.3-2 2-3.5-.5-2.5-2.5-4-5-4z" />
          </svg>
          <span className="text-xs font-medium">Animales</span>
        </Link>

        <Link
          href="/admin/chats"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/admin/chats") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs font-medium">Chats</span>
        </Link>

        <Link
          href="/admin/perfil"
          className={`flex flex-col items-center gap-1 py-2 flex-1 ${
            pathname?.startsWith("/admin/perfil") ? "text-[#6750A4]" : "text-[#49454F]"
          } hover:text-[#6750A4] transition-colors`}
        >
          <Building2 className="w-6 h-6" />
          <span className="text-xs font-medium">Mi Perfil</span>
        </Link>

        <Link
          href="/adopta"
          className="flex flex-col items-center gap-1 py-2 flex-1 text-[#D0BCFF] hover:text-[#6750A4] transition-colors"
        >
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">App</span>
        </Link>
      </div>
    </nav>
  )
}
