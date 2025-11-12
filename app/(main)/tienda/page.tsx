"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Filter, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ShopCartButton } from "@/components/shop-cart-button"

interface Category {
  id: string
  name: string
  icon: string
}

interface Product {
  id: string
  name: string
  price: number
  image_url: string
}

interface Banner {
  id: string
  image_url: string
  link_url: string
  title: string
}

export default function TiendaPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newProducts, setNewProducts] = useState<Product[]>([])
  const [banners, setBanners] = useState<Banner[]>([])
  const [currentBanner, setCurrentBanner] = useState(0)
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [searchModalOpen, setSearchModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<Product[]>([])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      searchProducts(searchQuery)
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  useEffect(() => {
    if (banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentBanner((prev) => (prev + 1) % banners.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [banners])

  const loadData = async () => {
    const supabase = createClient()

    const [categoriesRes, featuredRes, newRes, bannersRes] = await Promise.all([
      supabase.from("shop_categories").select("*").order("name"),
      supabase.from("shop_products").select("*").eq("featured", true).limit(6),
      supabase.from("shop_products").select("*").eq("is_new", true).limit(6),
      supabase.from("shop_banners").select("*").eq("active", true).order("order_index"),
    ])

    if (categoriesRes.data) setCategories(categoriesRes.data)
    if (featuredRes.data) setFeaturedProducts(featuredRes.data)
    if (newRes.data) setNewProducts(newRes.data)
    if (bannersRes.data) setBanners(bannersRes.data)
  }

  const searchProducts = async (query: string) => {
    const supabase = createClient()
    const { data } = await supabase.from("shop_products").select("*").ilike("name", `%${query}%`).limit(10)

    if (data) setSearchResults(data)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/tienda/buscar?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <ShopCartButton />

      {/* Filters */}
      <div className="px-4 bg-[#FFFBFE] shadow-sm py-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCategoryModalOpen(true)}
            className={`flex-1 bg-[#FFFBFE] border-[#79747E] text-[#1C1B1F] hover:bg-[#E8DEF8] hover:text-[#1C1B1F] rounded-full h-9 ${
              categoryModalOpen ? "bg-[#E8DEF8] border-[#6750A4]" : ""
            }`}
          >
            <Filter className="w-4 h-4 mr-2" />
            Categoría
          </Button>
          <Button
            variant="outline"
            onClick={() => setSearchModalOpen(true)}
            className={`flex-1 bg-[#FFFBFE] border-[#79747E] text-[#1C1B1F] hover:bg-[#E8DEF8] hover:text-[#1C1B1F] rounded-full h-9 ${
              searchModalOpen ? "bg-[#E8DEF8] border-[#6750A4]" : ""
            }`}
          >
            <Search className="w-4 h-4 mr-2" />
            Buscar
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pb-24">
        {/* Banner Slider */}
        {banners.length > 0 && (
          <div className="relative mx-4 mt-6 mb-6 rounded-lg overflow-hidden">
            <div className="relative h-48">
              {banners.map((banner, index) => (
                <Link
                  key={banner.id}
                  href={banner.link_url || "#"}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === currentBanner ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <img
                    src={banner.image_url || "/placeholder.svg"}
                    alt={banner.title}
                    className="w-full h-full object-cover"
                  />
                </Link>
              ))}
            </div>

            {banners.length > 1 && (
              <>
                <button
                  onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                  {banners.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentBanner(index)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentBanner ? "bg-white w-6" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Featured Products */}
        {featuredProducts.length > 0 && (
          <div className="mb-6 px-4">
            <h2 className="font-bold text-[#1C1B1F] mb-3 text-lg">Productos Destacados</h2>
            <div className="grid grid-cols-2 gap-3">
              {featuredProducts.map((product) => (
                <Link key={product.id} href={`/tienda/producto/${product.id}`}>
                  <Card className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow h-[260px] flex flex-col">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-40 object-cover mt-[-25px]"
                    />
                    <div className="p-3 flex-1 flex flex-col mt-[-20px]">
                      <h3 className="font-medium text-sm mb-1 line-clamp-2 overflow-hidden text-ellipsis">
                        {product.name}
                      </h3>
                      <p className="font-bold text-[#6750A4] mt-auto text-base">{product.price.toFixed(2)}€</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* New Products */}
        {newProducts.length > 0 && (
          <div className="mb-6 px-4">
            <h2 className="font-bold text-[#1C1B1F] mb-3 text-lg">Nuevos Productos</h2>
            <div className="grid grid-cols-2 gap-3">
              {newProducts.map((product) => (
                <Link key={product.id} href={`/tienda/producto/${product.id}`}>
                  <Card className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow h-[260px] flex flex-col">
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-40 object-cover mt-[-25px]"
                    />
                    <div className="p-3 flex-1 flex flex-col mt-[-20px]">
                      <h3 className="font-medium text-sm mb-1 line-clamp-2 overflow-hidden text-ellipsis">
                        {product.name}
                      </h3>
                      <p className="font-bold text-[#6750A4] mt-auto text-base">{product.price.toFixed(2)}€</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Category Modal */}
      <Sheet open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[50vh]">
          <SheetHeader>
            <SheetTitle>Selecciona una categoría</SheetTitle>
            <SheetDescription>Elige la categoría de productos que buscas</SheetDescription>
          </SheetHeader>
          <div className="overflow-y-auto h-[calc(50vh-120px)] space-y-2 px-4 mb-0 mt-4">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/tienda/categoria/${category.id}`}
                className="flex items-center gap-3 p-4 rounded-2xl border-2 border-[#79747E] bg-white hover:bg-[#E8DEF8] hover:border-[#6750A4] transition-colors"
                onClick={() => setCategoryModalOpen(false)}
              >
                <span className="text-2xl">{category.icon}</span>
                <span className="font-medium">{category.name}</span>
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Search Modal */}
      <Sheet open={searchModalOpen} onOpenChange={setSearchModalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl h-[50vh]">
          <SheetHeader>
            <SheetTitle>Buscar productos</SheetTitle>
            <SheetDescription>Escribe para buscar productos en tiempo real</SheetDescription>
          </SheetHeader>
          <form onSubmit={handleSearchSubmit} className="px-4 mt-0">
            <Input
              placeholder="Escribe para buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              className="rounded-full"
            />
          </form>
          {searchResults.length > 0 && (
            <div className="overflow-y-auto h-[calc(50vh-200px)] mt-4 px-4">
              <div className="space-y-2">
                {searchResults.map((product) => (
                  <Link
                    key={product.id}
                    href={`/tienda/producto/${product.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl border-2 border-[#79747E] bg-white hover:bg-[#E8DEF8] hover:border-[#6750A4] transition-colors"
                    onClick={() => setSearchModalOpen(false)}
                  >
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm line-clamp-1">{product.name}</h3>
                      <p className="text-sm font-bold text-[#6750A4]">{product.price.toFixed(2)}€</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
