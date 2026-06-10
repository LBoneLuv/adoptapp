import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Debes iniciar sesión" }, { status: 401 })

    const body = await request.json()
    const amount = Number(body?.amount)
    const message: string | null = body?.message || null
    if (!amount || amount <= 0) return NextResponse.json({ error: "Importe no válido" }, { status: 400 })

    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", user.id)
      .maybeSingle()

    const { data: donation, error } = await supabase
      .from("creator_donations")
      .insert({
        user_id: user.id,
        amount,
        currency: "eur",
        status: "pending",
        donor_email: profile?.email || user.email || null,
        message,
      })
      .select("id")
      .single()

    if (error || !donation) {
      console.error("[v0] creator-donation error:", error)
      return NextResponse.json({ error: "No se pudo registrar la donación" }, { status: 500 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin
    if (!stripeKey) {
      return NextResponse.json({ url: null, manual: true })
    }

    const stripe = new Stripe(stripeKey)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(amount * 100),
            product_data: { name: "Donación para mantener Arko" },
          },
        },
      ],
      customer_email: profile?.email || user.email || undefined,
      success_url: `${origin}/perfil?donated=1`,
      cancel_url: `${origin}/perfil`,
      metadata: { creator_donation_id: donation.id, user_id: user.id },
    })
    await supabase.from("creator_donations").update({ stripe_session_id: session.id }).eq("id", donation.id)
    return NextResponse.json({ url: session.url })
  } catch (e) {
    console.error("[v0] creator-donation error:", e)
    return NextResponse.json({ error: "Error al procesar la donación" }, { status: 500 })
  }
}
