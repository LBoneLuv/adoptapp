import Link from "next/link"
import { MessageSquare, Eye, Pin, Lock } from "lucide-react"
import { timeAgo } from "@/lib/time-ago"

export interface ForumThread {
  id: string
  title: string
  pinned?: boolean
  locked?: boolean
  views?: number
  reply_count?: number
  last_reply_at?: string
  created_at: string
  profiles?: { display_name: string | null; avatar_url: string | null } | null
  forum_categories?: { name: string; slug: string; icon: string | null } | null
}

export function ForumThreadRow({ thread, showCategory = false }: { thread: ForumThread; showCategory?: boolean }) {
  const author = thread.profiles?.display_name || "Usuario"
  return (
    <Link href={`/comunidad/hilo/${thread.id}`} className="block">
      <div className="bg-[#FFFBFE] rounded-2xl shadow-sm hover:shadow-md transition-shadow p-3 flex gap-3">
        <div className="w-10 h-10 rounded-full bg-[#6750A4] flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
          {thread.profiles?.avatar_url ? (
            <img src={thread.profiles.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
          ) : (
            author[0]?.toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            {thread.pinned && <Pin className="w-3.5 h-3.5 text-[#6750A4] flex-shrink-0" />}
            {thread.locked && <Lock className="w-3.5 h-3.5 text-[#79747E] flex-shrink-0" />}
            <h3 className="font-semibold text-[#1C1B1F] text-sm line-clamp-2 leading-tight">{thread.title}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-[#79747E] flex-wrap">
            <span>{author}</span>
            <span>·</span>
            <span>{timeAgo(thread.last_reply_at || thread.created_at)}</span>
            {showCategory && thread.forum_categories && (
              <>
                <span>·</span>
                <span className="text-[#6750A4] font-medium">
                  {thread.forum_categories.icon} {thread.forum_categories.name}
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end justify-center text-xs text-[#79747E] gap-1 flex-shrink-0">
          <span className="flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5" /> {thread.reply_count || 0}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" /> {thread.views || 0}
          </span>
        </div>
      </div>
    </Link>
  )
}
