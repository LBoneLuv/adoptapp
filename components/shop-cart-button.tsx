"use client"

import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export function ShopCartButton() {
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    loadCartCount()
  }, [])

  const loadCartCount = async () => {
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data, error } = await supabase.from("cart_items").select("quantity").eq("user_id", user.id)

        if (!error && data) {
          const total = data.reduce((sum, item) => sum + (item.quantity || 0), 0)
          setCartCount(total)
        }
      }
    } catch (error) {
      console.error("Error loading cart count:", error)
    }
  }

  return (
    <Link href="/tienda/carrito" className="fixed bottom-20 right-4 z-[1999]">
      <Button size="lg" className="w-14 h-14 rounded-full bg-[#6750A4] hover:bg-[#7965B3] shadow-lg relative mb-3.5">
        <ShoppingCart className="w-6 h-6 text-white" />
        {cartCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-[#D32F2F] text-white text-xs font-bold rounded-full min-w-[20px] h-[20px] flex items-center justify-center px-1">
            {cartCount > 99 ? "99+" : cartCount}
          </div>
        )}
      </Button>
    </Link>
  )
}
