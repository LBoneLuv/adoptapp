import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    console.log("[v0] API notificaciones llamada")

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY

    console.log("[v0] OneSignal App ID disponible:", !!appId)
    console.log("[v0] OneSignal REST API Key disponible:", !!restApiKey)

    if (!appId || !restApiKey) {
      console.log("[Adoptapp] OneSignal no configurado, omitiendo notificación")
      return NextResponse.json({
        success: false,
        message: "OneSignal not configured",
      })
    }

    const supabase = await createServerClient()
    const { chatId, messageContent, senderId } = await request.json()

    console.log("[v0] Datos recibidos - chatId:", chatId, "senderId:", senderId)

    // Obtener información del chat
    const { data: chat, error: chatError } = await supabase
      .from("chats")
      .select("user_id, shelter_id, animal_id, animals(name)")
      .eq("id", chatId)
      .single()

    if (chatError || !chat) {
      console.error("[v0] Error obteniendo chat:", chatError)
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    console.log("[v0] Chat encontrado:", chat)

    // Determinar quién es el receptor
    const recipientId = senderId === chat.user_id ? chat.shelter_id : chat.user_id
    console.log("[v0] ID del receptor:", recipientId)

    // Obtener el player ID del receptor
    const { data: recipientProfile, error: recipientError } = await supabase
      .from("profiles")
      .select("onesignal_player_id, display_name")
      .eq("id", recipientId)
      .single()

    console.log("[v0] Perfil del receptor:", recipientProfile)
    console.log("[v0] Error obteniendo perfil:", recipientError)

    if (!recipientProfile?.onesignal_player_id) {
      console.warn("[v0] Receptor no tiene player_id:", recipientProfile)
      return NextResponse.json({
        success: false,
        message: "Recipient not subscribed to push notifications",
      })
    }

    // Obtener el nombre del remitente
    const { data: senderProfile } = await supabase.from("profiles").select("display_name").eq("id", senderId).single()

    const animalName = chat.animals?.name || "un animal"
    const senderName = senderProfile?.display_name || "Un usuario"

    console.log("[v0] Enviando notificación a player_id:", recipientProfile.onesignal_player_id)

    // Enviar notificación a través de OneSignal
    const notificationPayload = {
      app_id: appId,
      include_player_ids: [recipientProfile.onesignal_player_id],
      headings: { en: `Mensaje de ${senderName}` },
      contents: { en: messageContent },
      data: {
        chatId,
        animalId: chat.animal_id,
        animalName,
        type: "chat_message",
      },
      web_url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/chats/${chatId}`,
      url: `${process.env.NEXT_PUBLIC_SITE_URL || ""}/chats/${chatId}`,
    }

    console.log("[v0] Payload de notificación:", JSON.stringify(notificationPayload, null, 2))

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify(notificationPayload),
    })

    const result = await response.json()

    console.log("[v0] Respuesta de OneSignal:", result)

    if (!response.ok) {
      console.error("[Adoptapp] Error enviando notificación OneSignal:", result)
      return NextResponse.json(
        {
          success: false,
          error: result,
        },
        { status: response.status },
      )
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("[Adoptapp] Error sending notification:", error)
    return NextResponse.json(
      {
        error: "Failed to send notification",
      },
      { status: 500 },
    )
  }
}
