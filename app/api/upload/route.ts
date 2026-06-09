import { put } from "@vercel/blob"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const token = process.env.BLOB_READ_WRITE_TOKEN
    if (!token) {
      console.error("[v0] Upload error: BLOB_READ_WRITE_TOKEN no está configurado")
      return NextResponse.json(
        { error: "Almacenamiento de imágenes no configurado (falta BLOB_READ_WRITE_TOKEN)" },
        { status: 500 },
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No se ha enviado ningún archivo" }, { status: 400 })
    }

    const blob = await put(file.name || "upload", file, {
      access: "public",
      addRandomSuffix: true,
      token,
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    console.error("[v0] Upload error:", message)
    return NextResponse.json({ error: `Error al subir la imagen: ${message}` }, { status: 500 })
  }
}
