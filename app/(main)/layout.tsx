"use client"

import type React from "react"
import { AppHeader } from "@/components/app-header"
import { BottomNavigation } from "@/components/bottom-navigation"
import { NotificationHandler } from "@/components/notification-handler"

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col h-screen bg-[#FEF7FF]">
      <NotificationHandler />
      <AppHeader />
      <div className="flex-1 overflow-hidden">{children}</div>
      <BottomNavigation />
    </div>
  )
}
