"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SlidersHorizontal, Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { ShopCartButton } from "@/components/shop-cart-button"
import { ProductCard, type ProductCardData } from "@/components/product-card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"

interface Product extends ProductCardData {
  category_id: string | null
  created_at?: string
}

interface Category {
  id: string
  name: string
}

export default function BuscarPage() {
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams?.get("q") || "")
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [priceRange, setPriceRange] = useState([0, 200])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [onlyOffers, setOnlyOffers] = useState(false)
  const [sortBy, setSortBy] = useState("name")
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from("shop_categories")
      .select("id, name")
      .then(({ data }) => setCategories(data || []))
  }, [])

  // Búsqueda en vivo (debounce) al cambiar el texto
  useEffect(() => {
    const supabase = createClient()
    const t = setTimeout(async () => {
      let q = supabase
        .from("shop_products")
        .select("id, name, price, compare_at_price, image_url, stock, is_new, rating, category_id, created_at")
      if (query.trim()) q = q.ilike("name", `%${query.trim()}%`)
      const { data } = await q.limit(100)
      setProducts((data as Product[]) || [])
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  const filtered = products
    .filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter((p) => selectedCategories.length === 0 || (p.category_id && selectedCategories.includes(p.category_id)))
    .filter((p) => !onlyOffers || (p.compare_at_price != null && (p.compare_at_price as number) > p.price))
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price
      if (sortBy === "price_desc") return b.price - a.price
      if (sortBy === "rating") return (b.rating || 0) - (a.rating || 0)
      if (sortBy === "newest") return (b.created_at || "").localeCompare(a.created_at || "")
      return a.name.localeCompare(b.name)
    })

  const activeFilters = (selectedCategories.length > 0 ? 1 : 0) + (onlyOffers ? 1 : 0) + (priceRange[0] > 0 || priceRange[1] < 200 ? 1 : 0)

  const toggleCategory = (id: string) =>
    setSelectedCategories((prev) => (prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]))

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <ShopCartButton />

      {/* Buscador editable */}
      <div className="p-4 bg-[#FFFBFE] shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#79747E]" />
          <Input
            placeholder="Buscar productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="rounded-full h-11 pl-11 pr-10 bg-[#FEF7FF] border-[#79747E] focus:border-[#6750A4]"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center hover:bg-[#E8DEF8]">
              <X className="w-4 h-4 text-[#79747E]" />
            </button>
          )}
        </div>
        <p className="text-sm text-[#49454F] mt-2">{filtered.length} productos</p>
      </div>

      {/* Filtros + orden */}
      <div className="px-4 py-3 bg-[#FFFBFE] border-b flex gap-2">
        <Button
          variant="outline"
          onClick={() => setFilterModalOpen(true)}
          className="flex-1 bg-[#FFFBFE] border-[#79747E] text-[#1C1B1F] hover:bg-[#E8DEF8] hover:text-[#1C1B1F] rounded-full h-9 relative"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtros
          {activeFilters > 0 && (
            <span className="ml-2 bg-[#6750A4] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </Button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="flex-1 px-4 py-2 border border-[#79747E] rounded-full text-sm bg-[#FFFBFE] text-[#1C1B1F] h-9"
        >
          <option value="name">Nombre (A-Z)</option>
          <option value="price_asc">Precio: menor a mayor</option>
          <option value="price_desc">Precio: mayor a menor</option>
          <option value="rating">Mejor valorados</option>
          <option value="newest">Novedades</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-[#49454F]">No se encontraron productos</div>
        )}
      </div>

      <Sheet open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[75vh]">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Personaliza tu búsqueda de productos</SheetDescription>
          </SheetHeader>

          <div className="overflow-y-auto max-h-[calc(75vh-180px)] mt-4 pl-5 pr-5 space-y-6">
            {/* Solo ofertas */}
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium text-[#1C1B1F]">Solo ofertas</span>
              <Checkbox checked={onlyOffers} onCheckedChange={(v) => setOnlyOffers(!!v)} />
            </label>

            {/* Price Range */}
            <div>
              <h3 className="font-medium mb-3">Rango de precio</h3>
              <Slider min={0} max={200} step={5} value={priceRange} onValueChange={setPriceRange} />
              <div className="flex justify-between mt-2 text-sm text-[#49454F]">
                <span>{priceRange[0]}€</span>
                <span>{priceRange[1]}€{priceRange[1] >= 200 ? "+" : ""}</span>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-medium mb-3">Categorías</h3>
              <div className="space-y-1">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer p-2">
                    <Checkbox checked={selectedCategories.includes(category.id)} onCheckedChange={() => toggleCategory(category.id)} />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-4 flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategories([])
                setOnlyOffers(false)
                setPriceRange([0, 200])
              }}
              className="border-[#79747E] text-[#49454F] rounded-full bg-transparent"
            >
              Limpiar
            </Button>
            <Button onClick={() => setFilterModalOpen(false)} className="flex-1 bg-[#6750A4] hover:bg-[#7965AF] rounded-full">
              Ver {filtered.length} productos
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
