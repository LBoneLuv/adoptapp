"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import useSWR from "swr"
import { useEffect, useState } from "react"

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

  useEffect(() => {
    setMounted(true)
  }, [])

  const getPageTitle = () => {
    if (pathname?.startsWith("/adopta")) return "Adoptapp"
    if (pathname?.startsWith("/protectoras")) return "Protectoras"
    if (pathname?.startsWith("/avisos")) return "Avisos"
    if (pathname?.startsWith("/comunidad")) return "Comunidad"
    return "Adoptapp"
  }

  return (
    <header className="flex items-center justify-between px-4 py-4 bg-[#FFFBFE] shadow-sm flex-shrink-0">
      <Link href="/adopta" className="flex items-center gap-2">
        <div className="w-10 h-10 bg-[#6750A4] rounded-2xl flex items-center justify-center">
          <svg
            className="w-6 h-6 text-white mt-[5px]"
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
        <h1 className="text-xl font-bold text-[#1C1B1F]">{getPageTitle()}</h1>
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
    </header>
  )
}
