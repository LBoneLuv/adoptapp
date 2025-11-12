"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { useEffect, useState } from "react"
import { MessageCircle } from "lucide-react"

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch user")
  return res.json()
}

export function AppHeader() {
  const pathname = usePathname()
  const { data: user } = useSWR("/api/user", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // 1 minute
  })
  const [mounted, setMounted] = useState(false)
  const [totalUnread, setTotalUnread] = useState(0)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && user) {
      loadUnreadCount()
      const interval = setInterval(loadUnreadCount, 10000) // Check every 10 seconds
      return () => clearInterval(interval)
    }
  }, [mounted, user])

  const loadUnreadCount = async () => {
    try {
      const res = await fetch("/api/chats/unread")
      if (res.ok) {
        const data = await res.json()
        setTotalUnread(data.count || 0)
      }
    } catch (error) {
      console.error("Error loading unread count:", error)
    }
  }

  const getPageTitle = () => {
    if (pathname?.startsWith("/principal")) return "Arko"
    if (pathname?.startsWith("/servicios")) return "Servicios"
    if (pathname?.startsWith("/favoritos")) return "Favoritos"
    if (pathname?.startsWith("/mis-animales")) return "Mis animales"
    if (pathname?.startsWith("/adopta")) return "Adoptar"
    if (pathname?.startsWith("/protectoras")) return "Protectoras"
    if (pathname?.startsWith("/avisos")) return "Avisos"
    if (pathname?.startsWith("/comunidad")) return "Comunidad"
    return "Arko"
  }

  return (
    <header className="flex items-center justify-between px-4 py-4 bg-[#FFFBFE] shadow-sm flex-shrink-0">
      <Link href="/principal" className="flex items-center gap-2">
        {pathname?.startsWith("/principal") ? (
          <img src="/arko-header-logo.svg" alt="Arko" className="w-auto h-10" />
        ) : (
          <>
            <img src="/arko-logo.svg" alt="Arko" className="w-10 h-10" />
            <h1 className="text-xl font-bold text-[#1C1B1F]">{getPageTitle()}</h1>
          </>
        )}
      </Link>
      <div className="flex items-center gap-3">
        <Link
          href="/chats"
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[#E8DEF8] transition-colors relative"
        >
          <MessageCircle className="w-5 h-5 text-[#6750A4]" />
          {totalUnread > 0 && (
            <div className="absolute -top-1 -right-1 bg-[#D32F2F] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
              {totalUnread > 99 ? "99+" : totalUnread}
            </div>
          )}
        </Link>
        <Link
          href="/perfil"
          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center hover:opacity-80 transition-opacity"
        >
          {mounted && user?.profile?.avatar_url ? (
            <img
              src={user.profile.avatar_url || "/placeholder.svg"}
              alt="Perfil"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#6750A4] flex items-center justify-center text-white font-bold text-sm">
              {mounted && user
                ? user?.profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"
                : "U"}
            </div>
          )}
        </Link>
      </div>
    </header>
  )
}
