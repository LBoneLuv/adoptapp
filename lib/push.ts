import { createClient as createAdminClient } from "@supabase/supabase-js"

// Envía una notificación push a un usuario vía OneSignal.
// Si OneSignal no está configurado o el usuario no tiene player_id, no hace nada.
export async function sendPushToUser(
  userId: string,
  notif: { title: string; message: string; url?: string },
): Promise<void> {
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID
  const apiKey = process.env.ONESIGNAL_REST_API_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!appId || !apiKey || !serviceKey) {
    console.log("[push] OneSignal/Supabase no configurado — push omitido")
    return
  }
  try {
    const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
      auth: { persistSession: false },
    })
    const { data: profile } = await admin
      .from("profiles")
      .select("onesignal_player_id")
      .eq("id", userId)
      .maybeSingle()
    const playerId = profile?.onesignal_player_id
    if (!playerId) {
      console.log("[push] usuario sin player_id — push omitido")
      return
    }
    await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: { Authorization: `Basic ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        app_id: appId,
        include_player_ids: [playerId],
        headings: { en: notif.title, es: notif.title },
        contents: { en: notif.message, es: notif.message },
        url: notif.url,
      }),
    })
  } catch (e) {
    console.error("[push] error:", e)
  }
}
