"use client"

import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AdoptButtonProps {
  animalId: string
  animalName: string
  shelterId: string
}

export function AdoptButton({ animalId, animalName, shelterId }: AdoptButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleAdopt = async () => {
    setLoading(true)
    const supabase = createBrowserClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    try {
      // Check if chat already exists
      const { data: existingChat } = await supabase
        .from("chats")
        .select("id")
        .eq("user_id", user.id)
        .eq("shelter_id", shelterId)
        .eq("animal_id", animalId)
        .maybeSingle()

      if (existingChat) {
        // Chat exists, redirect to it
        router.push(`/chats/${existingChat.id}`)
        return
      }

      // Create new chat
      const { data: newChat, error: chatError } = await supabase
        .from("chats")
        .insert({
          user_id: user.id,
          shelter_id: shelterId,
          animal_id: animalId,
          animal_name: animalName,
        })
        .select()
        .single()

      if (chatError) throw chatError

      // Create initial message
      const { error: messageError } = await supabase.from("messages").insert({
        chat_id: newChat.id,
        sender_id: user.id,
        content: `Estoy interesado en adoptar a ${animalName}`,
      })

      if (messageError) throw messageError

      // Redirect to chat
      router.push(`/chats/${newChat.id}`)
    } catch (error) {
      console.error("Error creating chat:", error)
      alert("Error al iniciar la conversación. Por favor, intenta de nuevo.")
      setLoading(false)
    }
  }

  return (
    <Button
      onClick={handleAdopt}
      disabled={loading}
      className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white font-semibold py-6 text-lg rounded-full shadow-md disabled:opacity-50"
    >
      {loading ? "Abriendo chat..." : "Solicitar Adopción"}
    </Button>
  )
}
