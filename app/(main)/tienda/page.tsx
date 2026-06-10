"use client"

import type React from "react"
import { useState, useEffect } from "react"
import useSWR from "swr"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ShopCartButton } from "@/components/shop-cart-button"
import { ProductCard, type ProductCardData } from "@/components/product-card"

interface Category {
  id: string
  name: string
  icon: string
}

interface Banner {
  id: string
  image_url: string
  link_url: string
  title: string
}

const fetchShopHome = async () => {
  const supabase = createClient()
  const [categoriesRes, featuredRes, newRes, bannersRes] = await Promise.all([
    supabase.from("shop_categories").select("*").order("name"),
    supabase.from("shop_products").select("*").eq("featured", true).limit(8),
    supabase.from("shop_products").select("*").eq("is_new", true).limit(8),
    supabase.from("shop_banners").select("*").eq("active", true).order("order_index"),
  ])
  return {
    categories: (categoriesRes.data as Category[]) || [],
    featured: (featuredRes.data as ProductCardData[]) || [],
    isNew: (newRes.data as ProductCardData[]) || [],
    banners: (bannersRes.data as Banner[]) || [],
  }
}

export default function TiendaPage() {
  const { data: shopData } = useSWR("tienda-home", fetchShopHome, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
    keepPreviousData: true,
  })
  const categories = shopData?.categories || []
  const featuredProducts = shopData?.featured || []
  const newProducts = shopData?.isNew || []
  const banners = shopData?.banners || []

  const [currentBanner, setCurrentBanner] = useState(0)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [banners])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/tienda/buscar?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <ShopCartButton />

      {/* Buscador siempre visible */}
      <div className="px-4 bg-[#FFFBFE] shadow-sm py-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#79747E]" />
          <Input
            placeholder="Buscar productos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-full h-11 pl-11 bg-[#FEF7FF] border-[#79747E] focus:border-[#6750A4]"
          />
        </form>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Categorías */}
        {categories.length > 0 && (
          <div className="px-4 pt-4">
            <div className="flex gap-3 overflow-x-auto pb-1 -mx-1 px-1">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/tienda/categoria/${category.id}`}
                  className="flex flex-col items-center gap-1.5 flex-shrink-0 w-16"
                >
                  <div className="w-14 h-14 rounded-2xl bg-[#E8DEF8] flex items-center justify-center text-2xl shadow-sm">
                    {category.icon || "🛍️"}
                  </div>
                  <span className="text-[11px] text-[#49454F] font-medium text-center leading-tight line-clamp-2">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Banner Slider */}
        {banners.length > 0 && (
          <div className="relative mx-4 mt-5 mb-6 rounded-2xl overflow-hidden">
            <div className="relative h-44">
              {banners.map((banner, index) => (
                <Link
                  key={banner.id}
                  href={banner.link_url || "#"}
                  className={`absolute inset-0 transition-opacity duration-500 ${index === currentBanner ? "opacity-100" : "opacity-0"}`}
                >
                  <img src={banner.image_url || "/placeholder.svg"} alt={banner.title} className="w-full h-full object-cover" />
                </Link>
              ))}
            </div>
            {banners.length > 1 && (
              <>
                <button onClick={() => setCurrentBanner((p) => (p - 1 + banners.length) % banners.length)} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => setCurrentBanner((p) => (p + 1) % banners.length)} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, index) => (
                    <button key={index} onClick={() => setCurrentBanner(index)} className={`w-2 h-2 rounded-full transition-all ${index === currentBanner ? "bg-white w-6" : "bg-white/50"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Featured */}
        {featuredProducts.length > 0 && (
          <div className="mb-6 px-4">
            <h2 className="font-bold text-[#1C1B1F] mb-3 text-lg">Productos destacados</h2>
            <div className="grid grid-cols-2 gap-3">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}

        {/* New */}
        {newProducts.length > 0 && (
          <div className="mb-6 px-4">
            <h2 className="font-bold text-[#1C1B1F] mb-3 text-lg">Novedades</h2>
            <div className="grid grid-cols-2 gap-3">
              {newProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
