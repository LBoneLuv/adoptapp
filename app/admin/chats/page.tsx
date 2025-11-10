"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"
import { MessageCircle } from "lucide-react"
import Image from "next/image"
import { AdminBottomNavigation } from "@/components/admin-bottom-navigation"

type Chat = {
  id: string
  animal_id: string | null
  animal_name: string | null
  shelter_id: string
  user_id: string
  last_message: string | null
  last_message_at: string
  user_name?: string
  user_avatar?: string
  unread_count_user?: number // Added separate unread counts
  unread_count_shelter?: number
}

export default function AdminChatsPage() {
  const [chats, setChats] = useState<Chat[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadChats()
  }, [])

  const loadChats = async () => {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return

    // Load chats where current user is the shelter
    const { data: chatsData, error } = await supabase
      .from("chats")
      .select("*")
      .eq("shelter_id", user.id)
      .order("last_message_at", { ascending: false })

    if (error) {
      console.error("Error loading chats:", error)
      setLoading(false)
      return
    }

    // Load user profiles
    const userIds = [...new Set(chatsData?.map((c) => c.user_id))]
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds)

    const profilesMap = (profilesData || []).reduce(
      (acc, profile) => {
        acc[profile.id] = { name: profile.display_name, avatar: profile.avatar_url }
        return acc
      },
      {} as Record<string, { name: string; avatar: string | null }>,
    )

    const chatsWithProfiles = (chatsData || []).map((chat) => ({
      ...chat,
      user_name: profilesMap[chat.user_id]?.name,
      user_avatar: profilesMap[chat.user_id]?.avatar,
    }))

    setChats(chatsWithProfiles)
    setLoading(false)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `Hace ${minutes}min`
    if (hours < 24) return `Hace ${hours}h`
    if (days < 7) return `Hace ${days}d`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#FEF7FF]">
        <div className="text-[#6750A4] font-medium">Cargando chats...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF] pb-20">
      <header className="flex items-center justify-between px-4 py-4 bg-[#FFFBFE] shadow-sm">
        <h1 className="text-xl font-bold text-[#1C1B1F]">Chats</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <MessageCircle className="w-16 h-16 text-[#79747E] mb-4" />
            <h3 className="text-lg font-semibold text-[#1C1B1F] mb-2">No tienes conversaciones</h3>
            <p className="text-sm text-[#49454F]">
              Cuando alguien se interese por tus animales, la conversación aparecerá aquí
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {chats.map((chat) => {
              const unreadCount = chat.unread_count_shelter || 0

              return (
                <Link key={chat.id} href={`/chats/${chat.id}`}>
                  <div className="bg-white rounded-3xl p-4 shadow-md hover:shadow-lg transition-shadow cursor-pointer mb-2.5">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-14 h-14 rounded-full overflow-hidden bg-[#E8DEF8]">
                          {chat.user_avatar ? (
                            <Image
                              src={chat.user_avatar || "/placeholder.svg"}
                              alt={chat.user_name || "Usuario"}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-[#6750A4] flex items-center justify-center text-white font-bold text-lg">
                              {(chat.user_name || "U")[0].toUpperCase()}
                            </div>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-[#D32F2F] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5 shadow-md z-10">
                            {unreadCount > 99 ? "99+" : unreadCount}
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="font-bold text-[#1C1B1F] truncate">{chat.user_name}</h3>
                          <span className="text-xs text-[#79747E] flex-shrink-0 ml-2">
                            {formatTime(chat.last_message_at)}
                          </span>
                        </div>

                        {chat.animal_name && (
                          <p className="text-xs text-[#6750A4] mb-1 flex items-center gap-1">
                            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                              <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
                              <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
                              <ellipse cx="5" cy="10" rx="2" ry="2.5" />
                              <ellipse cx="19" cy="10" rx="2" ry="2.5" />
                              <path d="M12 22c-3.5 0-5.5-2-5.5-4.5 0-2 1.5-3.5 3-4 .5-.2 1-.3 1.5-.3h2c.5 0 1 .1 1.5.3 1.5.5 3 2 3 4 0 2.5-2 4.5-5.5 4.5z" />
                            </svg>
                            {chat.animal_name}
                          </p>
                        )}

                        <p className="text-sm text-[#49454F] truncate">{chat.last_message || "No hay mensajes aún"}</p>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      <AdminBottomNavigation />
    </div>
  )
}
