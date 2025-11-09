"use server"

import { put } from "@vercel/blob"

export async function uploadPostImage(formData: FormData) {
  try {
    const file = formData.get("file") as File
    if (!file) {
      throw new Error("No file provided")
    }

    const blob = await put(`community/${Date.now()}-${file.name}`, file, {
      access: "public",
    })

    return { url: blob.url, error: null }
  } catch (error) {
    console.error("[v0] Error uploading image:", error)
    return { url: null, error: "Error al subir la imagen" }
  }
}

export async function moderateImage(imageFile: File): Promise<{ safe: boolean; error?: string }> {
  try {
    // Check allowed file types
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"]

    if (!allowedTypes.includes(imageFile.type)) {
      return {
        safe: false,
        error: "Tipo de imagen no permitido. Solo se permiten JPG, PNG, WebP y GIF.",
      }
    }

    // Check file size (max 10MB)
    if (imageFile.size > 10 * 1024 * 1024) {
      return {
        safe: false,
        error: "La imagen es demasiado grande. Máximo 10MB.",
      }
    }

    // TODO: Integrate with a content moderation API like:
    // - OpenAI Moderation API
    // - Google Cloud Vision API
    // - AWS Rekognition
    // - Sightengine
    //
    // For now, we'll just check basic properties and return safe
    // You can add API calls here to check for explicit content

    return { safe: true }
  } catch (error) {
    console.error("[v0] Error moderating image:", error)
    return {
      safe: false,
      error: "Error al verificar la imagen. Por favor, intenta de nuevo.",
    }
  }
}
