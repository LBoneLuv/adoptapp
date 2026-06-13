"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, ChevronRight, User } from "lucide-react"
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

export default function ComunidadPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [recent, setRecent] = useState<ForumThread[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [cats, threadCats, recentThreads] = await Promise.all([
        supabase.from("forum_categories").select("*").order("order_index"),
        supabase.from("forum_threads").select("category_id"),
        supabase
          .from("forum_threads")
          .select("*, profiles(display_name, avatar_url), forum_categories(name, slug, icon)")
          .order("last_reply_at", { ascending: false })
          .limit(15),
      ])
      setCategories((cats.data as Category[]) || [])
      const c: Record<string, number> = {}
      for (const t of threadCats.data || []) c[t.category_id] = (c[t.category_id] || 0) + 1
      setCounts(c)
      setRecent((recentThreads.data as ForumThread[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        {/* Acciones */}
        <div className="flex gap-2 mb-5">
          <Link href="/comunidad/nuevo" className="flex-1">
            <Button className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 font-semibold">
              <Plus className="w-5 h-5 mr-1" /> Nuevo hilo
            </Button>
          </Link>
          <Link href="/comunidad/mis-hilos">
            <Button variant="outline" className="border-[#6750A4] text-[#6750A4] rounded-full h-11 px-4 bg-transparent">
              <User className="w-4 h-4 mr-1" /> Mis hilos
            </Button>
          </Link>
        </div>

        {/* Categorías */}
        <h2 className="font-bold text-[#1C1B1F] text-lg mb-3">Categorías</h2>
        <div className="space-y-2 mb-6">
          {loading
            ? [1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)
            : categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/comunidad/${cat.slug}`}
                  className="flex items-center gap-3 bg-[#FFFBFE] rounded-2xl p-3 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="w-11 h-11 rounded-2xl bg-[#E8DEF8] flex items-center justify-center text-xl flex-shrink-0">
                    {cat.icon || "💬"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1C1B1F] text-sm">{cat.name}</p>
                    <p className="text-xs text-[#79747E] line-clamp-1">{cat.description}</p>
                  </div>
                  <span className="text-xs text-[#79747E] flex-shrink-0">{counts[cat.id] || 0} hilos</span>
                  <ChevronRight className="w-5 h-5 text-[#79747E] flex-shrink-0" />
                </Link>
              ))}
        </div>

        {/* Últimos hilos */}
        <h2 className="font-bold text-[#1C1B1F] text-lg mb-3">Últimos hilos</h2>
        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}</div>
        ) : recent.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-[#79747E]">Todavía no hay hilos.</p>
            <p className="text-sm text-[#79747E] mt-1">¡Crea el primero!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((t) => (
              <ForumThreadRow key={t.id} thread={t} showCategory />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
