import { createClient } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import Stripe from "stripe"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Debes iniciar sesión para donar" }, { status: 401 })
    }

    const body = await request.json()
    const shelterId: string = body?.shelterId
    const amount = Number(body?.amount)
    const message: string | null = body?.message || null

    if (!shelterId || !amount || amount <= 0) {
      return NextResponse.json({ error: "Importe no válido" }, { status: 400 })
    }

    const { data: shelter } = await supabase.from("shelters").select("name").eq("id", shelterId).single()
    if (!shelter) {
      return NextResponse.json({ error: "Protectora no encontrada" }, { status: 404 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name, email")
      .eq("id", user.id)
      .maybeSingle()

    const { data: donation, error: donationError } = await supabase
      .from("donations")
      .insert({
        shelter_id: shelterId,
        user_id: user.id,
        amount,
        currency: "eur",
        status: "pending",
        donor_name: profile?.display_name || null,
        donor_email: profile?.email || user.email || null,
        message,
      })
      .select("id")
      .single()

    if (donationError || !donation) {
      console.error("[v0] Error creating donation:", donationError)
      return NextResponse.json({ error: "No se pudo registrar la donación" }, { status: 500 })
    }

    const stripeKey = process.env.STRIPE_SECRET_KEY
    const origin =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin

    if (!stripeKey) {
      return NextResponse.json({ url: null, donationId: donation.id, manual: true })
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
            product_data: { name: `Donación a ${shelter.name}` },
          },
        },
      ],
      customer_email: profile?.email || user.email || undefined,
      success_url: `${origin}/protectora/${shelterId}?donated=1`,
      cancel_url: `${origin}/protectora/${shelterId}`,
      metadata: { donation_id: donation.id, shelter_id: shelterId, user_id: user.id },
    })

    await supabase.from("donations").update({ stripe_session_id: session.id }).eq("id", donation.id)

    return NextResponse.json({ url: session.url, donationId: donation.id })
  } catch (error) {
    console.error("[v0] Donate error:", error)
    return NextResponse.json({ error: "Error al procesar la donación" }, { status: 500 })
  }
}
