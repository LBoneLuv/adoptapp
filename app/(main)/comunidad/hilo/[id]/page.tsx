"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Pin, Lock, Send, Trash2, Eye, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { timeAgo } from "@/lib/time-ago"

interface Author {
  display_name: string | null
  avatar_url: string | null
}
interface Thread {
  id: string
  title: string
  content: string
  image_url: string | null
  pinned: boolean
  locked: boolean
  views: number
  reply_count: number
  created_at: string
  user_id: string
  profiles?: Author | null
  forum_categories?: { name: string; slug: string; icon: string | null } | null
}
interface Reply {
  id: string
  content: string
  created_at: string
  user_id: string
  profiles?: Author | null
}

function Avatar({ author }: { author?: Author | null }) {
  const name = author?.display_name || "Usuario"
  return (
    <div className="w-9 h-9 rounded-full bg-[#6750A4] flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
      {author?.avatar_url ? (
        <img src={author.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
      ) : (
        name[0]?.toUpperCase()
      )}
    </div>
  )
}

export default function ThreadPage() {
  const params = useParams()
  const id = params?.id as string
  const [thread, setThread] = useState<Thread | null>(null)
  const [replies, setReplies] = useState<Reply[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [text, setText] = useState("")
  const [sending, setSending] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data: t }, { data: r }] = await Promise.all([
      supabase
        .from("forum_threads")
        .select("*, profiles(display_name, avatar_url), forum_categories(name, slug, icon)")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("forum_replies")
        .select("*, profiles(display_name, avatar_url)")
        .eq("thread_id", id)
        .order("created_at", { ascending: true }),
    ])
    setThread(t as Thread)
    setReplies((r as Reply[]) || [])
    setLoading(false)
  }, [id])

  useEffect(() => {
    if (!id) return
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUserId(user?.id || null)
      if (user) {
        const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
        setIsAdmin(prof?.role === "super_admin")
      }
    })
    supabase.rpc("forum_increment_views", { p_thread: id }).then(() => {})
    load()
  }, [id, load])

  async function sendReply() {
    if (!text.trim() || !userId) {
      if (!userId) window.location.href = "/login"
      return
    }
    setSending(true)
    const supabase = createClient()
    const { error } = await supabase.from("forum_replies").insert({ thread_id: id, user_id: userId, content: text.trim() })
    setSending(false)
    if (!error) {
      setText("")
      load()
    }
  }

  async function deleteReply(replyId: string) {
    if (!confirm("¿Eliminar esta respuesta?")) return
    const supabase = createClient()
    await supabase.from("forum_replies").delete().eq("id", replyId)
    load()
  }

  async function deleteThread() {
    if (!confirm("¿Eliminar este hilo y todas sus respuestas?")) return
    const supabase = createClient()
    await supabase.from("forum_threads").delete().eq("id", id)
    window.location.href = "/comunidad"
  }

  if (loading) {
    return (
      <div className="px-4 py-4 space-y-3 bg-[#FEF7FF] h-full">
        <div className="h-24 bg-white rounded-2xl animate-pulse" />
        <div className="h-16 bg-white rounded-2xl animate-pulse" />
      </div>
    )
  }

  if (!thread) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#FEF7FF] text-center px-4">
        <p className="text-[#79747E]">Este hilo no existe o fue eliminado.</p>
        <Link href="/comunidad" className="text-[#6750A4] font-medium mt-2">
          Volver a la comunidad
        </Link>
      </div>
    )
  }

  const canModThread = userId === thread.user_id || isAdmin

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {/* Original post */}
        <div className="bg-[#FFFBFE] rounded-2xl shadow-sm p-4">
          {thread.forum_categories && (
            <Link href={`/comunidad/${thread.forum_categories.slug}`} className="inline-flex items-center gap-1 text-xs text-[#6750A4] font-medium mb-2">
              {thread.forum_categories.icon} {thread.forum_categories.name}
            </Link>
          )}
          <div className="flex items-start gap-1.5">
            {thread.pinned && <Pin className="w-4 h-4 text-[#6750A4] flex-shrink-0 mt-1" />}
            {thread.locked && <Lock className="w-4 h-4 text-[#79747E] flex-shrink-0 mt-1" />}
            <h1 className="font-bold text-[#1C1B1F] text-lg leading-tight">{thread.title}</h1>
          </div>
          <div className="flex items-center gap-2 mt-2 mb-3">
            <Avatar author={thread.profiles} />
            <div className="text-xs text-[#79747E]">
              <span className="font-medium text-[#49454F]">{thread.profiles?.display_name || "Usuario"}</span>
              <span> · {timeAgo(thread.created_at)}</span>
            </div>
          </div>
          {thread.image_url && (
            <img src={thread.image_url || "/placeholder.svg"} alt="" className="w-full rounded-2xl mb-3 object-cover max-h-80" />
          )}
          <p className="text-sm text-[#1C1B1F] whitespace-pre-wrap leading-relaxed">{thread.content}</p>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#E8DEF8] text-xs text-[#79747E]">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" /> {thread.reply_count} respuestas
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" /> {thread.views} vistas
            </span>
            {canModThread && (
              <button onClick={deleteThread} className="flex items-center gap-1 text-[#BA1A1A] ml-auto">
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </button>
            )}
          </div>
        </div>

        {/* Replies */}
        <h2 className="font-bold text-[#1C1B1F] text-base mt-5 mb-3">
          {replies.length > 0 ? `${replies.length} respuesta${replies.length === 1 ? "" : "s"}` : "Sin respuestas"}
        </h2>
        <div className="space-y-2">
          {replies.map((r) => (
            <div key={r.id} className="bg-[#FFFBFE] rounded-2xl shadow-sm p-3 flex gap-3">
              <Avatar author={r.profiles} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-[#79747E]">
                  <span className="font-medium text-[#49454F]">{r.profiles?.display_name || "Usuario"}</span>
                  <span>· {timeAgo(r.created_at)}</span>
                  {(userId === r.user_id || isAdmin) && (
                    <button onClick={() => deleteReply(r.id)} className="ml-auto text-[#BA1A1A]">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-[#1C1B1F] whitespace-pre-wrap leading-relaxed mt-1">{r.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reply composer */}
      {thread.locked ? (
        <div className="px-4 py-3 bg-[#FFFBFE] border-t border-[#E8DEF8] text-center text-sm text-[#79747E] flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" /> Este hilo está cerrado
        </div>
      ) : (
        <div className="px-3 py-3 bg-[#FFFBFE] border-t border-[#E8DEF8] flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={1}
            placeholder={userId ? "Escribe una respuesta..." : "Inicia sesión para responder"}
            className="flex-1 px-4 py-2.5 bg-[#FEF7FF] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm resize-none max-h-32"
          />
          <Button onClick={sendReply} disabled={sending || !text.trim()} className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 w-11 p-0 flex-shrink-0 disabled:opacity-40">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  )
}
