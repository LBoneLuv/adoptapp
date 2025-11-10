import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY

    if (!appId || !restApiKey) {
      console.log("[Adoptapp] OneSignal no configurado, omitiendo notificación")
      return NextResponse.json({
        success: false,
        message: "OneSignal not configured",
      })
    }

    const supabase = await createServerClient()
    const { chatId, messageContent, senderId } = await request.json()

    // Obtener información del chat
    const { data: chat } = await supabase
      .from("chats")
      .select("user_id, shelter_id, animal_id, animals(name)")
      .eq("id", chatId)
      .single()

    if (!chat) {
      return NextResponse.json({ error: "Chat not found" }, { status: 404 })
    }

    // Determinar quién es el receptor
    const recipientId = senderId === chat.user_id ? chat.shelter_id : chat.user_id

    // Obtener el player ID del receptor
    const { data: recipientProfile } = await supabase
      .from("profiles")
      .select("onesignal_player_id, name")
      .eq("id", recipientId)
      .single()

    if (!recipientProfile?.onesignal_player_id) {
      return NextResponse.json({
        success: false,
        message: "Recipient not subscribed to push notifications",
      })
    }

    // Obtener el nombre del remitente
    const { data: senderProfile } = await supabase.from("profiles").select("name").eq("id", senderId).single()

    const animalName = chat.animals?.name || "un animal"
    const senderName = senderProfile?.name || "Un usuario"

    // Enviar notificación a través de OneSignal
    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify({
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
      }),
    })

    const result = await response.json()

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
