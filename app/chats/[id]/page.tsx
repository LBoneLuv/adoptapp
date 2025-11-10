"use client"

import { useEffect, useState, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import { ArrowLeft, Send } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useParams } from "next/navigation"

type Message = {
  id: string
  sender_id: string
  content: string
  created_at: string
  read: boolean
}

type ChatInfo = {
  id: string
  animal_id: string | null
  animal_name: string | null
  shelter_id: string
  user_id: string
  shelter_name?: string
  shelter_avatar?: string
  user_name?: string
  user_avatar?: string
  unread_count_user?: number
  unread_count_shelter?: number
}

export default function ChatDetailPage() {
  const params = useParams()
  const id = params.id as string
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [chatInfo, setChatInfo] = useState<ChatInfo | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadChat()
    const interval = setInterval(loadMessages, 3000) // Poll every 3 seconds
    return () => clearInterval(interval)
  }, [id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChat = async () => {
    const supabase = createBrowserClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    setCurrentUserId(user.id)

    // Load chat info
    const { data: chat, error: chatError } = await supabase.from("chats").select("*").eq("id", id).single()

    if (chatError || !chat) {
      console.error("Error loading chat:", chatError)
      router.push("/chats")
      return
    }

    // Load shelter and user profiles
    const [shelterResponse, profileResponse] = await Promise.all([
      supabase.from("shelters").select("name, profile_image_url").eq("id", chat.shelter_id).single(),
      supabase.from("profiles").select("display_name, avatar_url").eq("id", chat.user_id).single(),
    ])

    setChatInfo({
      ...chat,
      shelter_name: shelterResponse.data?.name,
      shelter_avatar: shelterResponse.data?.profile_image_url,
      user_name: profileResponse.data?.display_name,
      user_avatar: profileResponse.data?.avatar_url,
    })

    const isUserChat = user.id === chat.user_id
    if (isUserChat) {
      await supabase.from("chats").update({ unread_count_user: 0 }).eq("id", id)
    } else {
      await supabase.from("chats").update({ unread_count_shelter: 0 }).eq("id", id)
    }

    // Mark all messages from the other person as read
    await supabase.from("messages").update({ read: true }).eq("chat_id", id).neq("sender_id", user.id).eq("read", false)

    loadMessages()
    setLoading(false)
  }

  const loadMessages = async () => {
    const supabase = createBrowserClient()

    const { data: messagesData, error } = await supabase
      .from("messages")
      .select("*")
      .eq("chat_id", id)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error loading messages:", error)
      return
    }

    setMessages(messagesData || [])
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId || sending || !chatInfo) return

    setSending(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.from("messages").insert({
      chat_id: id,
      sender_id: currentUserId,
      content: newMessage.trim(),
    })

    if (error) {
      console.error("Error sending message:", error)
      setSending(false)
      return
    }

    setNewMessage("")
    setSending(false)
    loadMessages()
  }

  if (loading || !chatInfo) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FEF7FF]">
        <div className="text-[#6750A4] font-medium">Cargando chat...</div>
      </div>
    )
  }

  const isUserChat = currentUserId === chatInfo.user_id
  const otherName = isUserChat ? chatInfo.shelter_name : chatInfo.user_name
  const otherAvatar = isUserChat ? chatInfo.shelter_avatar : chatInfo.user_avatar

  return (
    <div className="flex flex-col h-screen bg-[#FEF7FF]">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-4 bg-[#FFFBFE] shadow-sm">
        <Link
          href="/chats"
          className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#1C1B1F]" />
        </Link>

        <div className="w-10 h-10 rounded-full overflow-hidden bg-[#E8DEF8] flex-shrink-0">
          {otherAvatar ? (
            <Image
              src={otherAvatar || "/placeholder.svg"}
              alt={otherName || "Usuario"}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-[#6750A4] flex items-center justify-center text-white font-bold">
              {(otherName || "U")[0].toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="font-bold text-[#1C1B1F] truncate">{otherName}</h1>
          {chatInfo.animal_name && (
            <p className="text-xs text-[#6750A4] truncate flex items-center gap-1">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
                <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
                <ellipse cx="5" cy="10" rx="2" ry="2.5" />
                <ellipse cx="19" cy="10" rx="2" ry="2.5" />
                <path d="M12 22c-3.5 0-5.5-2-5.5-4.5 0-2 1.5-3.5 3-4 .5-.2 1-.3 1.5-.3h2c.5 0 1 .1 1.5.3 1.5.5 3 2 3 4 0 2.5-2 4.5-5.5 4.5z" />
              </svg>
              {chatInfo.animal_name}
            </p>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {messages.map((message) => {
          const isOwnMessage = message.sender_id === currentUserId

          return (
            <div key={message.id} className={`flex ${isOwnMessage ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-3xl px-4 py-3 ${
                  isOwnMessage ? "bg-[#6750A4] text-white" : "bg-white text-[#1C1B1F]"
                } shadow-sm`}
              >
                <p className="text-sm leading-relaxed break-words">{message.content}</p>
                <p className={`text-xs mt-1 ${isOwnMessage ? "text-white/70" : "text-[#79747E]"}`}>
                  {new Date(message.created_at).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="fixed bottom-0 left-0 right-0 px-4 py-4 bg-[#FFFBFE] shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-50">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !sending) {
                sendMessage()
              }
            }}
            placeholder="Escribe un mensaje..."
            className="flex-1 px-4 py-3 text-[#1C1B1F] bg-[#FEF7FF] rounded-full border border-[#79747E] focus:outline-none focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="w-12 h-12 bg-[#6750A4] rounded-full flex items-center justify-center hover:bg-[#7965B3] transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
