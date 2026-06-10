import { NextResponse, type NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { sendEmail, orderConfirmationHtml } from "@/lib/email"
import { sendPushToUser } from "@/lib/push"

// El webhook no tiene sesión de usuario: usamos la service role key para
// actualizar el pedido y vaciar el carrito saltándonos RLS.
function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } },
  )
}

export async function POST(request: NextRequest) {
  const stripeKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!stripeKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe no configurado" }, { status: 400 })
  }

  const stripe = new Stripe(stripeKey)
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature!, webhookSecret)
  } catch (err) {
    console.error("[v0] Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const orderId = session.metadata?.order_id
    const donationId = session.metadata?.donation_id
    const creatorDonationId = session.metadata?.creator_donation_id
    const userId = session.metadata?.user_id
    const supabase = adminClient()

    // Donación a protectora
    if (donationId) {
      await supabase
        .from("donations")
        .update({ status: "paid", stripe_payment_intent: (session.payment_intent as string) || null })
        .eq("id", donationId)
      return NextResponse.json({ received: true })
    }

    // Donación al creador
    if (creatorDonationId) {
      await supabase
        .from("creator_donations")
        .update({ status: "paid", stripe_payment_intent: (session.payment_intent as string) || null })
        .eq("id", creatorDonationId)
      return NextResponse.json({ received: true })
    }

    if (orderId) {
      await supabase
        .from("orders")
        .update({
          status: "paid",
          stripe_payment_intent: (session.payment_intent as string) || null,
        })
        .eq("id", orderId)

      // Descontar stock de los productos del pedido
      const { data: items } = await supabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("order_id", orderId)

      for (const item of items || []) {
        if (!item.product_id) continue
        const { data: prod } = await supabase
          .from("shop_products")
          .select("stock")
          .eq("id", item.product_id)
          .maybeSingle()
        if (prod) {
          await supabase
            .from("shop_products")
            .update({ stock: Math.max(0, (prod.stock || 0) - item.quantity) })
            .eq("id", item.product_id)
        }
      }

      // Email de confirmación + push al usuario
      const { data: order } = await supabase
        .from("orders")
        .select("user_id, total, discount, coupon_code, shipping_name, shipping_email")
        .eq("id", orderId)
        .maybeSingle()
      const { data: fullItems } = await supabase
        .from("order_items")
        .select("product_name, quantity, unit_price")
        .eq("order_id", orderId)
      if (order?.shipping_email) {
        await sendEmail({
          to: order.shipping_email,
          subject: "Confirmación de tu pedido",
          html: orderConfirmationHtml({
            orderId,
            name: order.shipping_name,
            items: (fullItems as any[]) || [],
            total: order.total,
            discount: order.discount,
            couponCode: order.coupon_code,
          }),
        })
      }
      if (order?.user_id) {
        await sendPushToUser(order.user_id, {
          title: "Pago confirmado",
          message: `Hemos recibido tu pago. Tu pedido #${orderId.slice(0, 8).toUpperCase()} está en marcha.`,
          url: "/tienda/pedidos",
        })
      }
    }

    // Vaciar el carrito del usuario
    if (userId) {
      await supabase.from("cart_items").delete().eq("user_id", userId)
    }
  }

  return NextResponse.json({ received: true })
}
