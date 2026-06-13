"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { ForumThreadRow, type ForumThread } from "@/components/forum-thread-row"

export default function MisHilosPage() {
  const [threads, setThreads] = useState<ForumThread[]>([])
  const [loading, setLoading] = useState(true)
  const [loggedIn, setLoggedIn] = useState(true)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        setLoggedIn(false)
        setLoading(false)
        return
      }
      const { data } = await supabase
        .from("forum_threads")
        .select("*, forum_categories(name, slug, icon)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
      setThreads((data as ForumThread[]) || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <h1 className="font-bold text-[#1C1B1F] text-lg mb-4">Mis hilos</h1>

        {loading ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}</div>
        ) : !loggedIn ? (
          <div className="text-center py-12">
            <p className="text-[#79747E] mb-3">Inicia sesión para ver tus hilos.</p>
            <Link href="/login">
              <Button className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full px-6">Iniciar sesión</Button>
            </Link>
          </div>
        ) : threads.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#79747E]">Todavía no has creado ningún hilo.</p>
            <Link href="/comunidad/nuevo">
              <Button className="mt-4 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full px-6">
                <Plus className="w-5 h-5 mr-1" /> Crear mi primer hilo
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((t) => (
              <ForumThreadRow key={t.id} thread={t} showCategory />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
