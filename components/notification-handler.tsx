"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

export function NotificationHandler() {
  const [permission, setPermission] = useState<NotificationPermission>("default")

  useEffect(() => {
    // Check if notifications are supported
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications")
      return
    }

    // Check current permission
    setPermission(Notification.permission)

    // Request permission if not granted
    if (Notification.permission === "default") {
      requestNotificationPermission()
    }

    const isProduction = !window.location.hostname.includes("vusercontent.net")

    if ("serviceWorker" in navigator && isProduction) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered:", registration)
        })
        .catch((error) => {
          console.error("Service Worker registration failed:", error)
        })
    }

    // Listen for new messages
    const supabase = createBrowserClient()
    let lastMessageCount = 0

    const checkNewMessages = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      // Check if user is a shelter
      const { data: shelter } = await supabase.from("shelters").select("id").eq("id", user.id).maybeSingle()

      // Get chats with proper unread count based on user type
      const { data: chats } = await supabase
        .from("chats")
        .select("unread_count_user, unread_count_shelter, user_id, shelter_id")
        .or(`user_id.eq.${user.id},shelter_id.eq.${user.id}`)

      if (chats) {
        // Calculate total unread: sum the count from the perspective of this user
        const totalUnread = chats.reduce((sum, chat) => {
          if (shelter) {
            // If current user is a shelter, count unread_count_shelter
            return sum + (chat.unread_count_shelter || 0)
          } else {
            // If current user is a regular user, count unread_count_user
            return sum + (chat.unread_count_user || 0)
          }
        }, 0)

        // If there are new messages, show notification
        if (totalUnread > lastMessageCount && lastMessageCount > 0 && Notification.permission === "granted") {
          showNotification("Nuevo mensaje", "Tienes mensajes nuevos en Adoptapp", "/chats")
        }

        lastMessageCount = totalUnread
      }
    }

    // Check every 15 seconds
    const interval = setInterval(checkNewMessages, 15000)

    // Initial check
    checkNewMessages()

    return () => clearInterval(interval)
  }, [])

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      setPermission(permission)
      if (permission === "granted") {
        console.log("Notification permission granted")
      }
    } catch (error) {
      console.error("Error requesting notification permission:", error)
    }
  }

  const showNotification = (title: string, body: string, url: string) => {
    if (Notification.permission === "granted") {
      if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(title, {
            body,
            icon: "/icon-192x192.png",
            badge: "/icon-72x72.png",
            tag: "adoptapp-message",
            data: url,
            requireInteraction: false,
            vibrate: [200, 100, 200],
          })
        })
      } else {
        // Fallback to simple browser notification
        const notification = new Notification(title, {
          body,
          icon: "/icon-192x192.png",
          tag: "adoptapp-message",
        })

        notification.onclick = () => {
          window.focus()
          window.location.href = url
          notification.close()
        }
      }
    }
  }

  return null
}
