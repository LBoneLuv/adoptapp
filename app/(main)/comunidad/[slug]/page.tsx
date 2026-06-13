"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ForumThreadRow, type ForumThread } from "@/components/forum-thread-row"

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
}

export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const [category, setCategory] = useState<Category | null>(null)
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    async function load() {
      const supabase = createClient()
      const { data: cat } = await supabase.from("forum_categories").select("*").eq("slug", slug).maybeSingle()
      if (cat) {
        setCategory(cat as Category)
        const { data } = await supabase
          .from("forum_threads")
          .select("*, profiles(display_name, avatar_url)")
          .eq("category_id", cat.id)
          .order("pinned", { ascending: false })
          .order("last_reply_at", { ascending: false })
        setThreads((data as ForumThread[]) || [])
      }
      setLoading(false)
    }
    load()
  }, [slug])

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {category && (
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#E8DEF8] flex items-center justify-center text-2xl flex-shrink-0">
              {category.icon || "💬"}
            </div>
            <div className="min-w-0">
              <h1 className="font-bold text-[#1C1B1F] text-lg">{category.name}</h1>
              <p className="text-xs text-[#79747E] line-clamp-2">{category.description}</p>
            </div>
          </div>
        )}

        <Link href={`/comunidad/nuevo?cat=${slug}`}>
          <Button className="w-full mb-4 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 font-semibold">
            <Plus className="w-5 h-5 mr-1" /> Crear hilo en {category?.name || "esta categoría"}
          </Button>
        </Link>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}</div>
        ) : threads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#79747E]">No hay hilos en esta categoría.</p>
            <p className="text-sm text-[#79747E] mt-1">¡Sé el primero en publicar!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <ForumThreadRow key={t.id} thread={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
