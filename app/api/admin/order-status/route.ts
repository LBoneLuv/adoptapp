import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { sendPushToUser } from "@/lib/push"
import { sendEmail } from "@/lib/email"
import { ORDER_STATUS } from "@/lib/order-status"

export async function POST(request: NextRequest) {
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

    const { orderId, status } = await request.json()
    if (!orderId || !ORDER_STATUS[status]) {
      return NextResponse.json({ error: "Datos no válidos" }, { status: 400 })
    }

    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId)
    if (error) {
      console.error("[v0] Error updating order status:", error)
      return NextResponse.json({ error: "No se pudo actualizar" }, { status: 500 })
    }

    const { data: order } = await supabase
      .from("orders")
      .select("user_id, shipping_email, shipping_name")
      .eq("id", orderId)
      .maybeSingle()

    const label = ORDER_STATUS[status].label
    if (order?.user_id) {
      await sendPushToUser(order.user_id, {
        title: "Estado de tu pedido",
        message: `Tu pedido #${String(orderId).slice(0, 8).toUpperCase()} está ahora: ${label}`,
        url: "/tienda/pedidos",
      })
    }
    if (order?.shipping_email) {
      await sendEmail({
        to: order.shipping_email,
        subject: `Tu pedido — ${label}`,
        html: `<p>Hola${order.shipping_name ? " " + order.shipping_name : ""}, el estado de tu pedido <strong>#${String(orderId).slice(0, 8).toUpperCase()}</strong> es ahora: <strong>${label}</strong>.</p>`,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[v0] order-status error:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
