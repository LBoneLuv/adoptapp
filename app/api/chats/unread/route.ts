import { createServerClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return Response.json({ count: 0 })
  }

  const { data: shelter } = await supabase.from("shelters").select("id").eq("id", user.id).maybeSingle()

  // Get total unread messages for this user
  const { data, error } = await supabase
    .from("chats")
    .select("unread_count_user, unread_count_shelter, user_id, shelter_id")
    .or(`user_id.eq.${user.id},shelter_id.eq.${user.id}`)

  if (error) {
    console.error("Error fetching unread count:", error)
    return Response.json({ count: 0 })
  }

  const totalUnread = (data || []).reduce((sum, chat) => {
    if (shelter) {
      // If current user is a shelter, count unread_count_shelter
      return sum + (chat.unread_count_shelter || 0)
    } else {
      // If current user is a regular user, count unread_count_user
      return sum + (chat.unread_count_user || 0)
    }
  }, 0)

  return Response.json({ count: totalUnread })
}
