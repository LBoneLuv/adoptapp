"use client"

import type React from "react"
import { uploadPostImage, moderateImage } from "@/app/actions/upload-post-image"

import {
  ArrowUp,
  ArrowDown,
  MessageCircle,
  Pencil,
  ImageIcon,
  Send,
  MoreVertical,
  Link2,
  Flag,
  MessageSquare,
} from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"

type Profile = {
  id: string
  display_name: string
  avatar_url: string | null
}

type Post = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  votes: number
  created_at: string
  profiles: Profile
  user_vote?: number
  comments_count: number
}

type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles: Profile
}

export default function ComunidadPage() {
  const supabase = createBrowserClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [postText, setPostText] = useState("")
  const [postImage, setPostImage] = useState<File | null>(null)
  const [postImagePreview, setPostImagePreview] = useState<string | null>(null)
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [commentText, setCommentText] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [comments, setComments] = useState<Comment[]>([])
  const [currentUser, setCurrentUser] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [openMenuPostId, setOpenMenuPostId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [reportReason, setReportReason] = useState("")
  const [reportingPostId, setReportingPostId] = useState<string | null>(null)

  useEffect(() => {
    loadCurrentUser()
    loadPosts()
  }, [])

  const loadCurrentUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

      if (profile) {
        setCurrentUser(profile)
      }
    }
  }

  const loadPosts = async () => {
    setLoading(true)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const { data: postsData, error } = await supabase
      .from("posts")
      .select(`
        *
      `)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("[v0] Error loading posts:", error)
      setLoading(false)
      return
    }

    // Load profiles separately
    const userIds = [...new Set(postsData?.map((p) => p.user_id) || [])]
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds)

    const profilesMap = (profilesData || []).reduce(
      (acc, profile) => {
        acc[profile.id] = profile
        return acc
      },
      {} as Record<string, Profile>,
    )

    // Load user votes if logged in
    let userVotes: Record<string, number> = {}
    if (user) {
      const { data: votesData } = await supabase.from("votes").select("post_id, vote_type").eq("user_id", user.id)

      if (votesData) {
        userVotes = votesData.reduce(
          (acc, vote) => {
            acc[vote.post_id] = vote.vote_type
            return acc
          },
          {} as Record<string, number>,
        )
      }
    }

    // Load comments count for each post
    const postsWithCounts = await Promise.all(
      (postsData || []).map(async (post) => {
        const { count } = await supabase
          .from("comments")
          .select("*", { count: "exact", head: true })
          .eq("post_id", post.id)

        return {
          ...post,
          profiles: profilesMap[post.user_id] || { id: post.user_id, display_name: "Usuario", avatar_url: null },
          user_vote: userVotes[post.id],
          comments_count: count || 0,
        }
      }),
    )

    setPosts(postsWithCounts as Post[])
    setLoading(false)
  }

  const loadComments = async (postId: string) => {
    const { data: commentsData, error } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", postId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("[v0] Error loading comments:", error)
      return
    }

    // Load profiles separately
    const userIds = [...new Set(commentsData?.map((c) => c.user_id) || [])]
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", userIds)

    const profilesMap = (profilesData || []).reduce(
      (acc, profile) => {
        acc[profile.id] = profile
        return acc
      },
      {} as Record<string, Profile>,
    )

    const commentsWithProfiles = (commentsData || []).map((comment) => ({
      ...comment,
      profiles: profilesMap[comment.user_id] || { id: comment.user_id, display_name: "Usuario", avatar_url: null },
    }))

    setComments(commentsWithProfiles as Comment[])
  }

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const moderation = await moderateImage(file)

      if (!moderation.safe) {
        showToast(moderation.error || "La imagen no cumple con nuestras políticas de contenido", "error")
        return
      }

      setPostImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setPostImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreatePost = async () => {
    if (!postText.trim() && !postImage) return
    if (!currentUser) {
      showToast("Debes iniciar sesión para crear un post", "error")
      return
    }

    setSubmitting(true)

    try {
      let imageUrl: string | null = null

      if (postImage) {
        const formData = new FormData()
        formData.append("file", postImage)

        const result = await uploadPostImage(formData)

        if (result.error) {
          throw new Error(result.error)
        }

        imageUrl = result.url
      }

      // Create post
      const { error } = await supabase.from("posts").insert({
        user_id: currentUser.id,
        content: postText,
        image_url: imageUrl,
        votes: 0,
      })

      if (error) throw error

      showToast("Publicación creada correctamente", "success")
      setIsModalOpen(false)
      setPostText("")
      setPostImage(null)
      setPostImagePreview(null)
      loadPosts()
    } catch (error) {
      console.error("[v0] Error creating post:", error)
      showToast("Error al crear la publicación", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleVote = async (postId: string, voteType: number) => {
    if (!currentUser) {
      showToast("Debes iniciar sesión para votar", "error")
      return
    }

    const post = posts.find((p) => p.id === postId)
    if (!post) return

    const currentVote = post.user_vote

    try {
      if (currentVote === voteType) {
        // Remove vote - trigger will update counter automatically
        await supabase.from("votes").delete().eq("post_id", postId).eq("user_id", currentUser.id)

        // Update local state
        setPosts(posts.map((p) => (p.id === postId ? { ...p, votes: p.votes - voteType, user_vote: undefined } : p)))
      } else {
        // Add or change vote
        if (currentVote !== undefined) {
          // Remove old vote first - trigger will handle counter
          await supabase.from("votes").delete().eq("post_id", postId).eq("user_id", currentUser.id)
        }

        // Insert new vote - trigger will handle counter
        await supabase.from("votes").insert({
          post_id: postId,
          user_id: currentUser.id,
          vote_type: voteType,
        })

        // Update local state
        const voteDelta = currentVote !== undefined ? voteType - currentVote : voteType
        setPosts(posts.map((p) => (p.id === postId ? { ...p, votes: p.votes + voteDelta, user_vote: voteType } : p)))
      }

      // Reload posts to ensure data is consistent
      setTimeout(() => loadPosts(), 500)
    } catch (error) {
      console.error("[v0] Error voting:", error)
      showToast("Error al votar", "error")
      // Reload posts on error to sync state
      loadPosts()
    }
  }

  const handleAddComment = async () => {
    if (!commentText.trim() || !selectedPostId || !currentUser) return

    try {
      const { error } = await supabase.from("comments").insert({
        post_id: selectedPostId,
        user_id: currentUser.id,
        content: commentText,
      })

      if (error) throw error

      setCommentText("")
      loadComments(selectedPostId)

      // Update comments count
      setPosts(posts.map((p) => (p.id === selectedPostId ? { ...p, comments_count: p.comments_count + 1 } : p)))
    } catch (error) {
      console.error("[v0] Error adding comment:", error)
      showToast("Error al añadir comentario", "error")
    }
  }

  const openCommentsModal = (postId: string) => {
    setSelectedPostId(postId)
    setIsCommentsModalOpen(true)
    loadComments(postId)
  }

  const showToast = (message: string, type: "success" | "error") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-20 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-lg z-[9999] ${
      type === "success" ? "bg-green-500" : "bg-red-500"
    } text-white font-medium`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()

    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 60) return `Hace ${minutes} min`
    if (hours < 24) return `Hace ${hours}h`
    return `Hace ${days}d`
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuPostId(null)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleCopyLink = (postId: string) => {
    const url = `${window.location.origin}/comunidad?post=${postId}`
    navigator.clipboard.writeText(url)
    showToast("Enlace copiado al portapapeles", "success")
    setOpenMenuPostId(null)
  }

  const handleOpenReportModal = (postId: string) => {
    setReportingPostId(postId)
    setIsReportModalOpen(true)
    setOpenMenuPostId(null)
  }

  const handleSubmitReport = async () => {
    if (!reportReason.trim() || !reportingPostId || !currentUser) return

    try {
      const { error } = await supabase.from("reports").insert({
        post_id: reportingPostId,
        reporter_id: currentUser.id,
        reason: reportReason,
        status: "pending",
      })

      if (error) throw error

      showToast("Reporte enviado correctamente. Lo revisaremos pronto.", "success")
      setIsReportModalOpen(false)
      setReportReason("")
      setReportingPostId(null)
    } catch (error) {
      console.error("[v0] Error submitting report:", error)
      showToast("Error al enviar el reporte", "error")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#FEF7FF]">
        <div className="text-[#6750A4] font-medium">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      {/* Posts Feed */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-3xl shadow-md overflow-hidden">
              {/* Post Header */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 bg-[#E8DEF8] rounded-full flex-shrink-0 overflow-hidden">
                  {post.profiles.avatar_url ? (
                    <img
                      src={post.profiles.avatar_url || "/placeholder.svg"}
                      alt={post.profiles.display_name || "Usuario"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#6750A4] flex items-center justify-center text-white font-bold">
                      {(post.profiles.display_name || "U")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-[#1C1B1F] text-sm">{post.profiles.display_name || "Usuario"}</h3>
                  <p className="text-xs text-[#49454F]">{formatTime(post.created_at)}</p>
                </div>
                <div className="relative" ref={openMenuPostId === post.id ? menuRef : null}>
                  <button
                    onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[#E8DEF8] transition-colors"
                  >
                    <MoreVertical className="w-5 h-5 text-[#49454F]" />
                  </button>

                  {openMenuPostId === post.id && (
                    <div className="absolute right-0 top-10 bg-white rounded-2xl shadow-xl border border-[#E8DEF8] py-2 z-[100] min-w-[200px]">
                      <button
                        onClick={() => handleCopyLink(post.id)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F3EDF7] transition-colors text-left"
                      >
                        <Link2 className="w-5 h-5 text-[#6750A4]" />
                        <span className="text-[#1C1B1F] font-medium">Copiar enlace</span>
                      </button>
                      <button
                        onClick={() => {
                          openCommentsModal(post.id)
                          setOpenMenuPostId(null)
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F3EDF7] transition-colors text-left"
                      >
                        <MessageSquare className="w-5 h-5 text-[#6750A4]" />
                        <span className="text-[#1C1B1F] font-medium">Comentar</span>
                      </button>
                      <button
                        onClick={() => handleOpenReportModal(post.id)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[#F3EDF7] transition-colors text-left"
                      >
                        <Flag className="w-5 h-5 text-red-500" />
                        <span className="text-red-500 font-medium">Reportar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Post Content */}
              <div className="px-4 pb-3">
                <p className="text-[#1C1B1F] leading-relaxed text-sm">{post.content}</p>
              </div>

              {/* Post Image */}
              {post.image_url && (
                <div className="w-full">
                  <img
                    src={post.image_url || "/placeholder.svg"}
                    alt="Post image"
                    className="w-full h-64 object-cover"
                  />
                </div>
              )}

              {/* Post Actions */}
              <div className="flex items-center gap-4 px-4 py-3 border-t border-[#E8DEF8]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleVote(post.id, 1)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      post.user_vote === 1
                        ? "bg-[#6750A4] text-white"
                        : "bg-[#E8DEF8] text-[#6750A4] hover:bg-[#D0BCFF]"
                    }`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-[#1C1B1F] min-w-[24px] text-center">{post.votes}</span>
                  <button
                    onClick={() => handleVote(post.id, -1)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      post.user_vote === -1
                        ? "bg-[#6750A4] text-white"
                        : "bg-[#E8DEF8] text-[#6750A4] hover:bg-[#D0BCFF]"
                    }`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={() => openCommentsModal(post.id)}
                  className="flex items-center gap-2 px-3 py-2 bg-[#E8DEF8] rounded-full hover:bg-[#D0BCFF] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#6750A4]" />
                  <span className="text-sm font-medium text-[#6750A4]">{post.comments_count}</span>
                </button>
              </div>
            </div>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[#79747E]">No hay publicaciones aún</p>
              <p className="text-sm text-[#79747E] mt-2">¡Sé el primero en compartir algo!</p>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#6750A4] rounded-full shadow-lg flex items-center justify-center hover:bg-[#7965B3] transition-colors z-[1999]"
      >
        <Pencil className="w-6 h-6 text-white" />
      </button>

      {/* Create Post Modal */}
      {isModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[2050] transition-opacity"
            onClick={() => setIsModalOpen(false)}
          />

          <div className="fixed bottom-0 left-0 right-0 bg-[#FFFBFE] rounded-t-3xl shadow-2xl z-[2100] max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 bg-[#79747E] rounded-full opacity-40" />
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DEF8]">
              <h2 className="text-xl font-semibold text-[#1C1B1F]">Crear Publicación</h2>
              <button
                onClick={handleCreatePost}
                disabled={submitting || (!postText.trim() && !postImage)}
                className="px-4 py-2 text-[#6750A4] font-semibold hover:bg-[#E8DEF8] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "Publicando..." : "Publicar"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#E8DEF8] rounded-full flex-shrink-0 overflow-hidden">
                  {currentUser?.avatar_url ? (
                    <img
                      src={currentUser.avatar_url || "/placeholder.svg"}
                      alt={currentUser.display_name || "Usuario"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-[#6750A4] flex items-center justify-center text-white font-bold">
                      {(currentUser?.display_name || "U")[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-[#1C1B1F]">{currentUser?.display_name || "Usuario"}</h3>
                </div>
              </div>

              <textarea
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
                placeholder="¿Qué estás pensando?"
                className="w-full min-h-[200px] p-4 text-[#1C1B1F] bg-[#FEF7FF] rounded-2xl border border-[#E8DEF8] focus:outline-none focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 resize-none"
              />

              {postImagePreview && (
                <div className="mt-4 relative">
                  <img
                    src={postImagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-2xl"
                  />
                  <button
                    onClick={() => {
                      setPostImage(null)
                      setPostImagePreview(null)
                    }}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className="px-4 py-3 border-t border-[#E8DEF8] bg-[#FFFBFE]">
              <label className="flex items-center gap-2 px-4 py-2 bg-[#E8DEF8] rounded-full hover:bg-[#D0BCFF] transition-colors cursor-pointer">
                <ImageIcon className="w-5 h-5 text-[#6750A4]" />
                <span className="text-sm font-medium text-[#6750A4]">Adjuntar Foto</span>
                <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
              </label>
            </div>
          </div>
        </>
      )}

      {/* Comments Modal */}
      {isCommentsModalOpen && selectedPostId && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[2050] transition-opacity"
            onClick={() => {
              setIsCommentsModalOpen(false)
              setSelectedPostId(null)
              setCommentText("")
            }}
          />

          <div className="fixed bottom-0 left-0 right-0 bg-[#FFFBFE] rounded-t-3xl shadow-2xl z-[2100] max-h-[75vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 bg-[#79747E] rounded-full opacity-40" />
            </div>

            <div className="px-4 py-3 border-b border-[#E8DEF8]">
              <h2 className="text-xl font-semibold text-[#1C1B1F]">Comentarios</h2>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="w-10 h-10 bg-[#E8DEF8] rounded-full flex-shrink-0 overflow-hidden">
                      {comment.profiles.avatar_url ? (
                        <img
                          src={comment.profiles.avatar_url || "/placeholder.svg"}
                          alt={comment.profiles.display_name || "Usuario"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[#6750A4] flex items-center justify-center text-white font-bold text-sm">
                          {(comment.profiles.display_name || "U")[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 bg-[#F3EDF7] rounded-2xl px-4 py-3">
                      <h4 className="font-bold text-[#1C1B1F] text-sm">{comment.profiles.display_name || "Usuario"}</h4>
                      <p className="text-[#1C1B1F] text-sm mt-1 leading-relaxed">{comment.content}</p>
                      <p className="text-xs text-[#49454F] mt-2">{formatTime(comment.created_at)}</p>
                    </div>
                  </div>
                ))}

                {comments.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-[#79747E]">No hay comentarios aún</p>
                    <p className="text-sm text-[#79747E] mt-2">¡Sé el primero en comentar!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="px-4 py-3 border-t border-[#E8DEF8] bg-[#FFFBFE]">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter" && commentText.trim()) {
                      handleAddComment()
                    }
                  }}
                  placeholder="Escribe un comentario..."
                  className="flex-1 px-4 py-3 text-[#1C1B1F] bg-[#FEF7FF] rounded-full border border-[#79747E] focus:outline-none focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim()}
                  className="w-12 h-12 bg-[#6750A4] rounded-full flex items-center justify-center hover:bg-[#7965B3] transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {isReportModalOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[2050] transition-opacity"
            onClick={() => {
              setIsReportModalOpen(false)
              setReportReason("")
              setReportingPostId(null)
            }}
          />

          <div className="fixed bottom-0 left-0 right-0 bg-[#FFFBFE] rounded-t-3xl shadow-2xl z-[2100] max-h-[70vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-8 h-1 bg-[#79747E] rounded-full opacity-40" />
            </div>

            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E8DEF8]">
              <h2 className="text-xl font-semibold text-[#1C1B1F]">Reportar Publicación</h2>
              <button
                onClick={handleSubmitReport}
                disabled={!reportReason.trim()}
                className="px-4 py-2 text-[#6750A4] font-semibold hover:bg-[#E8DEF8] rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
              <p className="text-[#49454F] mb-4">
                Si esta publicación viola nuestras normas de comunidad, ayúdanos a mantener un espacio seguro
                reportándola.
              </p>

              <textarea
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe por qué reportas esta publicación..."
                className="w-full min-h-[150px] p-4 text-[#1C1B1F] bg-[#FEF7FF] rounded-2xl border border-[#E8DEF8] focus:outline-none focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/20 resize-none"
              />

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-[#1C1B1F]">Motivos comunes:</p>
                <div className="flex flex-wrap gap-2">
                  {["Spam", "Acoso o bullying", "Contenido ofensivo", "Información falsa", "Otro"].map((reason) => (
                    <button
                      key={reason}
                      onClick={() => setReportReason(reason)}
                      className="px-3 py-2 bg-[#E8DEF8] text-[#6750A4] rounded-full text-sm font-medium hover:bg-[#D0BCFF] transition-colors"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
