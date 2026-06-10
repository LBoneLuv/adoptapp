"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface Review {
  id: string
  rating: number
  comment: string | null
  user_id: string
  profiles: { display_name: string | null; avatar_url: string | null } | null
}

function StarRow({ value, onChange, size = 5 }: { value: number; onChange?: (v: number) => void; size?: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} type="button" disabled={!onChange} onClick={() => onChange?.(i)} className={onChange ? "cursor-pointer" : "cursor-default"}>
          <Star className={`${size === 5 ? "w-7 h-7" : "w-4 h-4"} ${i <= value ? "fill-[#FFC107] text-[#FFC107]" : "text-[#D0BCFF]"}`} />
        </button>
      ))}
    </div>
  )
}

export function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [myRating, setMyRating] = useState(0)
  const [myComment, setMyComment] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId])

  async function load() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    setUserId(user?.id || null)
    const { data } = await supabase
      .from("product_reviews")
      .select("id, rating, comment, user_id, profiles(display_name, avatar_url)")
      .eq("product_id", productId)
      .order("created_at", { ascending: false })
    const list = (data as unknown as Review[]) || []
    setReviews(list)
    if (user) {
      const mine = list.find((r) => r.user_id === user.id)
      if (mine) {
        setMyRating(mine.rating)
        setMyComment(mine.comment || "")
      }
    }
    setLoading(false)
  }

  async function submit() {
    if (!userId || myRating === 0) return
    setSaving(true)
    const supabase = createClient()
    const { data: existing } = await supabase
      .from("product_reviews")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .maybeSingle()
    const payload = { rating: myRating, comment: myComment || null }
    const { error } = existing
      ? await supabase.from("product_reviews").update(payload).eq("id", existing.id)
      : await supabase.from("product_reviews").insert({ product_id: productId, user_id: userId, ...payload })
    setSaving(false)
    if (!error) await load()
  }

  if (loading) return <div className="mt-6 h-20 bg-[#FFFBFE] rounded-2xl animate-pulse" />

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-[#1C1B1F]">Valoraciones</h2>
        {reviews.length > 0 && (
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-[#FFC107] text-[#FFC107]" />
            <span className="font-semibold text-[#1C1B1F]">{avg.toFixed(1)}</span>
            <span className="text-[#79747E]">({reviews.length})</span>
          </div>
        )}
      </div>

      {userId ? (
        <div className="bg-[#FFFBFE] rounded-2xl p-4 shadow-sm mb-4">
          <p className="text-sm font-medium text-[#49454F] mb-2">Tu valoración</p>
          <StarRow value={myRating} onChange={setMyRating} />
          <textarea
            value={myComment}
            onChange={(e) => setMyComment(e.target.value)}
            placeholder="¿Qué te ha parecido? (opcional)"
            rows={3}
            className="w-full mt-3 px-4 py-3 bg-[#FEF7FF] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm resize-none"
          />
          <Button onClick={submit} disabled={saving || myRating === 0} className="w-full mt-3 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-10 text-sm font-semibold disabled:opacity-50">
            {saving ? "Guardando..." : "Publicar valoración"}
          </Button>
        </div>
      ) : (
        <Link href="/login" className="block bg-[#E8DEF8] rounded-2xl p-4 text-center text-sm text-[#6750A4] font-medium mb-4">
          Inicia sesión para valorar este producto
        </Link>
      )}

      {reviews.length === 0 ? (
        <p className="text-sm text-[#79747E] text-center py-4">Todavía no hay valoraciones.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="bg-[#FFFBFE] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 rounded-full bg-[#6750A4] flex items-center justify-center text-white text-sm font-bold overflow-hidden flex-shrink-0">
                  {r.profiles?.avatar_url ? (
                    <img src={r.profiles.avatar_url || "/placeholder.svg"} alt="" className="w-full h-full object-cover" />
                  ) : (
                    r.profiles?.display_name?.[0]?.toUpperCase() || "U"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#1C1B1F] line-clamp-1">{r.profiles?.display_name || "Usuario"}</p>
                  <StarRow value={r.rating} size={4} />
                </div>
              </div>
              {r.comment && <p className="text-sm text-[#49454F]">{r.comment}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
