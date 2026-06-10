"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Minus, Plus, ShoppingCart, Check, Heart, Share2, Truck, RotateCcw, ShieldCheck, Star, X, ChevronLeft, ChevronRight } from "lucide-react"
import { ProductCard, type ProductCardData } from "@/components/product-card"
import { ProductReviews } from "@/components/product-reviews"
import { addRecentlyViewed } from "@/lib/recently-viewed"

interface Product {
  id: string
  name: string
  description: string | null
  price: number
  compare_at_price: number | null
  image_url: string | null
  gallery_images: string[] | null
  stock: number
  category_id: string | null
  rating: number | null
  reviews_count: number | null
}

export default function ProductoPage() {
  const params = useParams()
  const router = useRouter()
  const id = params?.id as string
  const [product, setProduct] = useState<Product | null>(null)
  const [categoryName, setCategoryName] = useState("")
  const [related, setRelated] = useState<ProductCardData[]>([])
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)
  const [added, setAdded] = useState(false)
  const [activeImg, setActiveImg] = useState(0)
  const [isFav, setIsFav] = useState(false)
  const [lightbox, setLightbox] = useState(false)

  useEffect(() => {
    if (!id) return
    addRecentlyViewed(id)
    const supabase = createClient()
    async function load() {
      const { data } = await supabase.from("shop_products").select("*").eq("id", id).single()
      if (data) {
        setProduct(data)
        if (data.category_id) {
          const [{ data: cat }, { data: rel }] = await Promise.all([
            supabase.from("shop_categories").select("name").eq("id", data.category_id).maybeSingle(),
            supabase
              .from("shop_products")
              .select("id, name, price, compare_at_price, image_url, stock, is_new, rating")
              .eq("category_id", data.category_id)
              .neq("id", id)
              .limit(6),
          ])
          if (cat) setCategoryName(cat.name)
          setRelated((rel as ProductCardData[]) || [])
        }
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user) {
          const { data: fav } = await supabase
            .from("product_favorites")
            .select("id")
            .eq("user_id", user.id)
            .eq("product_id", id)
            .maybeSingle()
          setIsFav(!!fav)
        }
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function toggleFav() {
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    if (isFav) {
      await supabase.from("product_favorites").delete().eq("user_id", user.id).eq("product_id", id)
      setIsFav(false)
    } else {
      await supabase.from("product_favorites").insert({ user_id: user.id, product_id: id })
      setIsFav(true)
    }
  }

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: product?.name, url })
      } catch {
        /* cancelado */
      }
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  async function addToCart() {
    if (!product) return
    setAdding(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      router.push("/login")
      return
    }
    const { data: existing } = await supabase
      .from("cart_items")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle()
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id)
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity })
    }
    setAdding(false)
    setAdded(true)
    window.dispatchEvent(new Event("cart-updated"))
    setTimeout(() => setAdded(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6750A4]" />
      </div>
    )
  }
  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-[#FEF7FF]">
        <p className="text-[#49454F] mb-4">No se encontró el producto</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  const outOfStock = product.stock <= 0
  const onSale = product.compare_at_price != null && product.compare_at_price > product.price
  const discount = onSale ? Math.round((1 - product.price / (product.compare_at_price as number)) * 100) : 0
  const images = [product.image_url, ...(product.gallery_images || [])].filter(Boolean) as string[]
  const gallery = images.length ? images : ["/placeholder.svg"]

  return (
    <div className="min-h-screen bg-[#FEF7FF] pb-28">
      {/* Gallery */}
      <div className="relative bg-white">
        <img
          src={gallery[activeImg] || "/placeholder.svg"}
          alt={product.name}
          className="w-full h-72 object-cover cursor-zoom-in"
          onClick={() => setLightbox(true)}
        />
        {gallery.length > 1 && (
          <span className="absolute bottom-3 left-3 bg-black/50 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {activeImg + 1}/{gallery.length}
          </span>
        )}
        <div className="absolute top-3 right-3 flex flex-col gap-2">
          <button onClick={toggleFav} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow" aria-label="Favorito">
            <Heart className={`w-5 h-5 ${isFav ? "fill-[#D32F2F] text-[#D32F2F]" : "text-[#6750A4]"}`} />
          </button>
          <button onClick={share} className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow" aria-label="Compartir">
            <Share2 className="w-5 h-5 text-[#6750A4]" />
          </button>
        </div>
        {onSale && (
          <span className="absolute top-3 left-3 bg-[#D32F2F] text-white text-sm font-bold px-3 py-1 rounded-full">-{discount}%</span>
        )}
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-2 px-4 py-3 overflow-x-auto">
          {gallery.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveImg(i)}
              className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 ${i === activeImg ? "border-[#6750A4]" : "border-transparent"}`}
            >
              <img src={img || "/placeholder.svg"} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      <div className="px-4 py-2">
        {categoryName && (
          <span className="text-xs font-semibold text-[#6750A4] bg-[#E8DEF8] px-3 py-1 rounded-full">{categoryName}</span>
        )}
        <h1 className="text-2xl font-bold text-[#1C1B1F] mt-3">{product.name}</h1>

        {product.rating != null && (
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 fill-[#FFC107] text-[#FFC107]" />
            <span className="text-sm font-medium text-[#1C1B1F]">{product.rating.toFixed(1)}</span>
            {product.reviews_count ? <span className="text-xs text-[#79747E]">({product.reviews_count})</span> : null}
          </div>
        )}

        <div className="flex items-baseline gap-3 mt-2">
          <p className="text-2xl font-bold text-[#6750A4]">{product.price.toFixed(2)}€</p>
          {onSale && (
            <>
              <span className="text-base text-[#79747E] line-through">{(product.compare_at_price as number).toFixed(2)}€</span>
              <span className="text-xs font-bold text-[#D32F2F] bg-[#FDECEA] px-2 py-0.5 rounded-full">Ahorras {((product.compare_at_price as number) - product.price).toFixed(2)}€</span>
            </>
          )}
        </div>

        {/* Stock / urgencia */}
        {outOfStock ? (
          <p className="text-sm mt-2 text-[#C5221F] font-medium">Agotado</p>
        ) : product.stock <= 5 ? (
          <p className="text-sm mt-2 text-[#C5221F] font-medium">¡Solo quedan {product.stock}!</p>
        ) : (
          <p className="text-sm mt-2 text-[#1E7E34]">En stock</p>
        )}

        {/* Trust signals */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: Truck, label: "Envío 24-48h" },
            { icon: RotateCcw, label: "Devolución gratis" },
            { icon: ShieldCheck, label: "Pago seguro" },
          ].map((t) => {
            const Icon = t.icon
            return (
              <div key={t.label} className="flex flex-col items-center gap-1 bg-[#FFFBFE] rounded-2xl py-3 shadow-sm text-center">
                <Icon className="w-5 h-5 text-[#6750A4]" />
                <span className="text-[10px] text-[#49454F] font-medium leading-tight">{t.label}</span>
              </div>
            )
          })}
        </div>

        {product.description && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold text-[#1C1B1F] mb-2">Descripción</h2>
            <div
              className="text-[#49454F] text-sm leading-relaxed [&_p]:mb-2 [&_h2]:font-bold [&_h2]:text-base [&_h2]:text-[#1C1B1F] [&_h2]:mt-3 [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_img]:rounded-xl [&_img]:my-2 [&_a]:text-[#6750A4] [&_a]:underline"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </div>
        )}

        {/* Quantity */}
        {!outOfStock && (
          <div className="flex items-center gap-4 mt-6">
            <span className="text-sm font-medium text-[#49454F]">Cantidad</span>
            <div className="flex items-center gap-3 bg-[#FFFBFE] rounded-full shadow-sm p-1">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-full bg-[#E8DEF8] flex items-center justify-center">
                <Minus className="w-4 h-4 text-[#6750A4]" />
              </button>
              <span className="w-6 text-center font-semibold text-[#1C1B1F]">{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="w-9 h-9 rounded-full bg-[#E8DEF8] flex items-center justify-center">
                <Plus className="w-4 h-4 text-[#6750A4]" />
              </button>
            </div>
          </div>
        )}

        {/* Reviews */}
        <ProductReviews productId={product.id} />

        {/* Related */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-[#1C1B1F] mb-3">También te puede interesar</h2>
            <div className="grid grid-cols-2 gap-3">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div className="fixed inset-0 bg-black/95 z-[2100] flex items-center justify-center" onClick={() => setLightbox(false)}>
          <button onClick={() => setLightbox(false)} className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
            <X className="w-6 h-6 text-white" />
          </button>
          {gallery.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveImg((i) => (i - 1 + gallery.length) % gallery.length)
              }}
              className="absolute left-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"
            >
              <ChevronLeft className="w-7 h-7 text-white" />
            </button>
          )}
          <img src={gallery[activeImg] || "/placeholder.svg"} alt={product.name} className="max-w-full max-h-full object-contain p-4" />
          {gallery.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                setActiveImg((i) => (i + 1) % gallery.length)
              }}
              className="absolute right-4 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"
            >
              <ChevronRight className="w-7 h-7 text-white" />
            </button>
          )}
        </div>
      )}

      {/* Add to cart bar */}
      <div className="fixed bottom-16 left-0 right-0 px-4 py-3 bg-[#FFFBFE] shadow-[0_-2px_8px_rgba(0,0,0,0.1)] z-[1998]">
        <Button
          onClick={addToCart}
          disabled={adding || outOfStock}
          className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold disabled:opacity-50"
        >
          {added ? (
            <>
              <Check className="w-5 h-5 mr-2" /> Añadido al carrito
            </>
          ) : (
            <>
              <ShoppingCart className="w-5 h-5 mr-2" />
              {outOfStock ? "Agotado" : `Añadir · ${(product.price * quantity).toFixed(2)}€`}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
