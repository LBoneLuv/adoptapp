"use client"

import { useEffect, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => void>
    OneSignal?: any
  }
}

let isOneSignalInitialized = false

export function OneSignalProvider() {
  const initAttemptedRef = useRef(false)

  useEffect(() => {
    if (typeof window === "undefined" || initAttemptedRef.current || isOneSignalInitialized) return
    initAttemptedRef.current = true

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
      if (isOneSignalInitialized) {
        console.log("[Adoptapp] OneSignal ya está inicializado")
        return
      }

      try {
        await OneSignal.init({
          appId: appId,
          safari_web_id: process.env.NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID,
          notifyButton: {
            enable: false,
          },
          allowLocalhostAsSecureOrigin: true,
        })

        isOneSignalInitialized = true
        console.log("[Adoptapp] OneSignal inicializado correctamente")

        const supabase = createBrowserClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user) {
          console.log("[v0] Usuario autenticado:", user.id)

          const permission = await OneSignal.Notifications.requestPermission()
          console.log("[v0] Permiso de notificaciones:", permission)

          if (permission) {
            await new Promise((resolve) => setTimeout(resolve, 1000))

            const subscription = OneSignal.User.PushSubscription
            const playerId = subscription.id || subscription.token

            console.log("[v0] Subscription completa:", subscription)
            console.log("[v0] Player ID obtenido:", playerId)

            if (playerId) {
              const { error } = await supabase
                .from("profiles")
                .update({ onesignal_player_id: playerId })
                .eq("id", user.id)
              if (error) {
                console.error("[v0] Error guardando player_id:", error)
              } else {
                console.log("[v0] Player ID guardado en BD correctamente")
              }

              const { data: shelterData } = await supabase.from("shelters").select("id").eq("id", user.id).maybeSingle()

              if (shelterData) {
                await OneSignal.User.addTag("user_type", "shelter")
                await OneSignal.User.addTag("shelter_id", user.id)
                console.log("[v0] Tags de protectora añadidos")
              } else {
                await OneSignal.User.addTag("user_type", "user")
                await OneSignal.User.addTag("user_id", user.id)
                console.log("[v0] Tags de usuario añadidos")
              }
            } else {
              console.warn("[v0] No se pudo obtener el player ID. El usuario debe aceptar las notificaciones.")
            }
          } else {
            console.log("[v0] El usuario no aceptó las notificaciones push")
          }
        }
      } catch (error: any) {
        isOneSignalInitialized = false
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
