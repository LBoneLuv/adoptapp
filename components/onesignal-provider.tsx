"use client"

import { useEffect } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>
    OneSignal?: any
  }
}

export function OneSignalProvider() {
  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window === "undefined") return

    const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID

    if (!appId || appId === "") {
      console.log("[Adoptapp] OneSignal no configurado. Las notificaciones push no estarán disponibles.")
      return
    }

    const script = document.createElement("script")
    script.src = "https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
    script.defer = true

    script.onerror = () => {
      console.log("[Adoptapp] No se pudo cargar el SDK de OneSignal")
    }

    document.head.appendChild(script)

    window.OneSignalDeferred = window.OneSignalDeferred || []
    window.OneSignalDeferred.push(async (OneSignal) => {
      try {
        await OneSignal.init({
          appId: appId,
          safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
          notifyButton: {
            enable: false,
          },
          allowLocalhostAsSecureOrigin: true,
        })

        console.log("[Adoptapp] OneSignal inicializado correctamente")

        const supabase = createBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          const playerId = await OneSignal.User.PushSubscription.id
          if (playerId) {
            await supabase.from("profiles").update({ onesignal_player_id: playerId }).eq("id", user.id)
          }

          const { data: shelterData } = await supabase.from("shelters").select("id").eq("id", user.id).maybeSingle()

          if (shelterData) {
            await OneSignal.User.addTag("user_type", "shelter")
            await OneSignal.User.addTag("shelter_id", user.id)
          } else {
            await OneSignal.User.addTag("user_type", "user")
            await OneSignal.User.addTag("user_id", user.id)
          }
        }
      } catch (error: any) {
        // Manejo silencioso de errores - OneSignal es opcional
        if (error?.message?.includes("not configured for web push")) {
          console.log("[Adoptapp] OneSignal requiere configuración adicional en el dashboard.")
          console.log("[Adoptapp] Revisa ONESIGNAL_SETUP.md para instrucciones completas.")
        } else {
          console.log("[Adoptapp] OneSignal no disponible:", error?.message || "Error desconocido")
        }
      }
    })

    return () => {
      if (script.parentNode) {
        document.head.removeChild(script)
      }
    }
  }, [])

  return null
}
