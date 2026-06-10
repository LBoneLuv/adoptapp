import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"
import { validateCoupon, type CouponRow } from "@/lib/coupon"
import { sendEmail, orderConfirmationHtml } from "@/lib/email"

interface CartProduct {
  id: string
  name: string
  price: number
  image_url: string | null
}
interface CartRow {
  quantity: number
  product: CartProduct | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const shipping = body?.shipping || {}
    const couponCode = body?.couponCode

    // Cargar el carrito desde el servidor (no confiamos en el cliente para los precios)
    const { data: cart } = await supabase
      .from("cart_items")
      .select("quantity, product:shop_products(id, name, price, image_url)")
      .eq("user_id", user.id)

    const lines = ((cart as unknown as CartRow[]) || []).filter((l) => l.product)
    if (lines.length === 0) {
      return NextResponse.json({ error: "El carrito está vacío" }, { status: 400 })
    }

    const subtotal = lines.reduce((sum, l) => sum + (l.product!.price || 0) * l.quantity, 0)

    // Validar el cupón en el servidor (no confiamos en el cliente)
    let discount = 0
    let appliedCode: string | null = null
    let appliedCoupon: CouponRow | null = null
    if (couponCode) {
      const { data: c } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", String(couponCode).toUpperCase())
        .maybeSingle()
      const r = validateCoupon(c as CouponRow | null, subtotal)
      if (r.ok && c) {
        discount = r.discount
        appliedCode = (c as CouponRow).code
        appliedCoupon = c as CouponRow
      }
    }
    const total = Math.max(0, subtotal - discount)

    // 1) Crear el pedido (pendiente) + líneas
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user.id,
        status: "pending",
        total,
        discount,
        coupon_code: appliedCode,
        currency: "eur",
        shipping_name: shipping.name || null,
        shipping_email: shipping.email || null,
        shipping_phone: shipping.phone || null,
        shipping_address: shipping.address || null,
        shipping_city: shipping.city || null,
        shipping_postal_code: shipping.postal_code || null,
      })
      .select("id")
      .single()

    if (orderError || !order) {
      console.error("[v0] Error creating order:", orderError)
      return NextResponse.json({ error: "No se pudo crear el pedido" }, { status: 500 })
    }

    const orderItems = lines.map((l) => ({
      order_id: order.id,
      product_id: l.product!.id,
      product_name: l.product!.name,
      image_url: l.product!.image_url,
      unit_price: l.product!.price,
      quantity: l.quantity,
    }))
    await supabase.from("order_items").insert(orderItems)

    // Contar el uso del cupón (con service role, el usuario no puede escribir en coupons)
    if (appliedCoupon?.id) {
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (serviceKey) {
        const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
          auth: { persistSession: false },
        })
        await admin
          .from("coupons")
          .update({ used_count: (appliedCoupon.used_count || 0) + 1 })
          .eq("id", appliedCoupon.id)
      }
    }

    // 2) Si Stripe está configurado, crear sesión de Checkout
    const stripeKey = process.env.STRIPE_SECRET_KEY
    const origin =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

    if (!stripeKey) {
      // Modo manual: el pedido queda como 'pending' y se gestiona a mano.
      console.warn("[v0] STRIPE_SECRET_KEY no configurada — pedido creado en modo manual")
      if (shipping.email) {
        await sendEmail({
          to: shipping.email,
          subject: "Confirmación de tu pedido",
          html: orderConfirmationHtml({
            orderId: order.id,
            name: shipping.name,
            items: lines.map((l) => ({ product_name: l.product!.name, quantity: l.quantity, unit_price: l.product!.price })),
            total,
            discount,
            couponCode: appliedCode,
          }),
        })
      }
      return NextResponse.json({ url: null, orderId: order.id, manual: true })
    }

    const stripe = new Stripe(stripeKey)

    // Aplicar el descuento del cupón como coupon de Stripe (importe exacto)
    let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined
    if (discount > 0) {
      const stripeCoupon = await stripe.coupons.create({
        amount_off: Math.round(discount * 100),
        currency: "eur",
        duration: "once",
        name: appliedCode || "Descuento",
      })
      discounts = [{ coupon: stripeCoupon.id }]
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      discounts,
      line_items: lines.map((l) => ({
        quantity: l.quantity,
        price_data: {
          currency: "eur",
          unit_amount: Math.round((l.product!.price || 0) * 100),
          product_data: {
            name: l.product!.name,
            images: l.product!.image_url ? [l.product!.image_url] : undefined,
          },
        },
      })),
      customer_email: shipping.email || user.email || undefined,
      success_url: `${origin}/tienda/carrito?success=1`,
      cancel_url: `${origin}/tienda/carrito`,
      metadata: { order_id: order.id, user_id: user.id },
    })

    await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id)

    return NextResponse.json({ url: session.url, orderId: order.id })
  } catch (error) {
    console.error("[v0] Checkout error:", error)
    return NextResponse.json({ error: "Error al procesar el pago" }, { status: 500 })
  }
}
