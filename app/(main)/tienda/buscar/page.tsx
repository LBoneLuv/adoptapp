"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { SlidersHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { ShopCartButton } from "@/components/shop-cart-button"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"

interface Product {
  id: string
  name: string
  price: number
  image_url: string
  category_id: string
}

interface Category {
  id: string
  name: string
}

export default function BuscarPage() {
  const searchParams = useSearchParams()
  const query = searchParams?.get("q") || ""
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [priceRange, setPriceRange] = useState([0, 200])
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [sortBy, setSortBy] = useState("name")
  const [filterModalOpen, setFilterModalOpen] = useState(false)

  useEffect(() => {
    loadProducts()
    loadCategories()
  }, [query])

  useEffect(() => {
    applyFilters()
  }, [products, priceRange, selectedCategories, sortBy])

  const loadProducts = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("shop_products").select("*").ilike("name", `%${query}%`)

    if (data) setProducts(data)
  }

  const loadCategories = async () => {
    const supabase = createClient()
    const { data } = await supabase.from("shop_categories").select("*")
    if (data) setCategories(data)
  }

  const applyFilters = () => {
    let filtered = products.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1])

    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category_id))
    }

    filtered.sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price
      if (sortBy === "price_desc") return b.price - a.price
      return a.name.localeCompare(b.name)
    })

    setFilteredProducts(filtered)
  }

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId) ? prev.filter((id) => id !== categoryId) : [...prev, categoryId],
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <ShopCartButton />

      {/* Header */}
      <div className="p-4 bg-[#FFFBFE] shadow-sm">
        <h1 className="text-xl font-bold mb-1">Resultados para "{query}"</h1>
        <p className="text-sm text-[#49454F]">{filteredProducts.length} productos encontrados</p>
      </div>

      <div className="px-4 py-3 bg-[#FFFBFE] border-b flex gap-2">
        <Button
          variant="outline"
          onClick={() => setFilterModalOpen(true)}
          className="flex-1 bg-[#FFFBFE] border-[#79747E] text-[#1C1B1F] hover:bg-[#E8DEF8] hover:text-[#1C1B1F] rounded-full h-9"
        >
          <SlidersHorizontal className="w-4 h-4 mr-2" />
          Filtros
        </Button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="flex-1 px-4 py-2 border border-[#79747E] rounded-full text-sm bg-[#FFFBFE] text-[#1C1B1F] h-9"
        >
          <option value="name">Nombre</option>
          <option value="price_asc">Precio: Menor a Mayor</option>
          <option value="price_desc">Precio: Mayor a Menor</option>
        </select>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <div className="grid grid-cols-2 gap-3">
          {filteredProducts.map((product) => (
            <Link key={product.id} href={`/tienda/producto/${product.id}`}>
              <Card className="border-0 shadow-md overflow-hidden hover:shadow-lg transition-shadow h-[260px] flex flex-col">
                <img
                  src={product.image_url || "/placeholder.svg"}
                  alt={product.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-medium text-sm mb-1 line-clamp-2 overflow-hidden text-ellipsis">
                    {product.name}
                  </h3>
                  <p className="text-lg font-bold text-[#6750A4] mt-auto">{product.price.toFixed(2)}€</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-12 text-[#49454F]">No se encontraron productos</div>
        )}
      </div>

      <Sheet open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[70vh]">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
            <SheetDescription>Personaliza tu búsqueda de productos</SheetDescription>
          </SheetHeader>

          <div className="overflow-y-auto max-h-[calc(70vh-180px)] mt-4 pl-5 pr-5 space-y-6">
            {/* Price Range */}
            <div>
              <h3 className="font-medium mb-3">Rango de precio</h3>
              <Slider min={0} max={200} step={5} value={priceRange} onValueChange={setPriceRange} />
              <div className="flex justify-between mt-2 text-sm text-[#49454F]">
                <span>{priceRange[0]}€</span>
                <span>{priceRange[1]}€</span>
              </div>
            </div>

            {/* Categories */}
            <div>
              <h3 className="font-medium mb-3">Categorías</h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 cursor-pointer p-2">
                    <Checkbox
                      checked={selectedCategories.includes(category.id)}
                      onCheckedChange={() => toggleCategory(category.id)}
                    />
                    <span className="text-sm">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="px-5 py-4">
            <Button onClick={() => setFilterModalOpen(false)} className="w-full bg-[#6750A4] rounded-full">
              Aplicar filtros
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
