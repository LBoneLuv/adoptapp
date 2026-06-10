import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

const PAID = ["paid", "processing", "shipped", "delivered"]

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle()
    const { data: sh } = await supabase.from("shelters").select("role").eq("id", user.id).maybeSingle()
    if (profile?.role !== "super_admin" && sh?.role !== "super_admin") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) return NextResponse.json({ error: "Service role no configurado" }, { status: 500 })
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    })

    const [ordersRes, itemsRes, users, products, lowStock, pros, shelters, animals] = await Promise.all([
      admin.from("orders").select("id, total, status, created_at"),
      admin.from("order_items").select("product_name, quantity, image_url"),
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("shop_products").select("id", { count: "exact", head: true }),
      admin.from("shop_products").select("id", { count: "exact", head: true }).lte("stock", 5),
      admin.from("professionals").select("id", { count: "exact", head: true }),
      admin.from("shelters").select("id", { count: "exact", head: true }),
      admin.from("animals").select("id", { count: "exact", head: true }),
    ])

    const orders = ordersRes.data || []
    const items = itemsRes.data || []

    const paidOrders = orders.filter((o) => PAID.includes(o.status))
    const revenue = paidOrders.reduce((s, o) => s + Number(o.total || 0), 0)
    const avgOrder = paidOrders.length ? revenue / paidOrders.length : 0

    const ordersByStatus: Record<string, number> = {}
    for (const o of orders) ordersByStatus[o.status] = (ordersByStatus[o.status] || 0) + 1

    // Top productos (por unidades)
    const prodMap: Record<string, { name: string; image: string | null; qty: number }> = {}
    for (const it of items) {
      const k = it.product_name
      if (!prodMap[k]) prodMap[k] = { name: k, image: it.image_url, qty: 0 }
      prodMap[k].qty += it.quantity || 0
    }
    const topProducts = Object.values(prodMap)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5)

    // Últimos 14 días (ingresos + pedidos)
    const days: { date: string; label: string; revenue: number; orders: number }[] = []
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      days.push({ date: key, label: `${d.getDate()}/${d.getMonth() + 1}`, revenue: 0, orders: 0 })
    }
    const dayIndex: Record<string, number> = {}
    days.forEach((d, i) => (dayIndex[d.date] = i))
    for (const o of orders) {
      const key = (o.created_at || "").slice(0, 10)
      const idx = dayIndex[key]
      if (idx === undefined) continue
      days[idx].orders += 1
      if (PAID.includes(o.status)) days[idx].revenue += Number(o.total || 0)
    }

    return NextResponse.json({
      revenue,
      avgOrder,
      totalOrders: orders.length,
      paidOrders: paidOrders.length,
      ordersByStatus,
      topProducts,
      days,
      counts: {
        users: users.count || 0,
        products: products.count || 0,
        lowStock: lowStock.count || 0,
        professionals: pros.count || 0,
        shelters: shelters.count || 0,
        animals: animals.count || 0,
      },
    })
  } catch (e) {
    console.error("[v0] analytics error:", e)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
