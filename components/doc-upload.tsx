"use client"

import type React from "react"
import { useState } from "react"
import { Camera, FileText, X, Eye, Plus, Loader2 } from "lucide-react"

function isImage(url: string) {
  return /\.(png|jpe?g|gif|webp|avif|svg)(\?|$)/i.test(url)
}

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData()
  fd.append("file", file)
  const res = await fetch("/api/upload", { method: "POST", body: fd })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || "Error al subir el archivo")
  }
  const { url } = await res.json()
  return url
}

interface DocUploadProps {
  /** url única (single) o array de urls (multiple) */
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  accept?: string
  label?: string
  hint?: string
}

export function DocUpload({
  value,
  onChange,
  multiple = false,
  accept = "image/*,.pdf",
  label = "Toca para subir",
  hint,
}: DocUploadProps) {
  const [uploading, setUploading] = useState(false)
  const urls = multiple ? ((value as string[]) || []) : value ? [value as string] : []

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const uploaded = await Promise.all(files.map(uploadFile))
      if (multiple) {
        onChange([...(value as string[]), ...uploaded])
      } else {
        onChange(uploaded[0])
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al subir el archivo")
    } finally {
      setUploading(false)
      e.target.value = ""
    }
  }

  function removeAt(index: number) {
    if (multiple) {
      onChange((value as string[]).filter((_, i) => i !== index))
    } else {
      onChange("")
    }
  }

  const showTile = multiple || urls.length === 0

  return (
    <div className="space-y-3">
      {/* Previews */}
      {urls.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {urls.map((url, i) => (
            <div key={i} className="relative group">
              {isImage(url) ? (
                <img src={url || "/placeholder.svg"} alt={`Documento ${i + 1}`} className="w-full h-24 object-cover rounded-2xl bg-[#E8DEF8]" />
              ) : (
                <div className="w-full h-24 rounded-2xl bg-[#E8DEF8] flex flex-col items-center justify-center gap-1">
                  <FileText className="w-7 h-7 text-[#6750A4]" />
                  <span className="text-[10px] text-[#6750A4] font-medium">Doc {i + 1}</span>
                </div>
              )}
              <button
                type="button"
                onClick={() => window.open(url, "_blank")}
                className="absolute bottom-1 left-1 w-7 h-7 rounded-full bg-white/90 flex items-center justify-center shadow"
                aria-label="Ver"
              >
                <Eye className="w-4 h-4 text-[#6750A4]" />
              </button>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-[#BA1A1A] rounded-full flex items-center justify-center shadow-md"
                aria-label="Eliminar"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload tile */}
      {showTile && (
        <label className="block cursor-pointer">
          <input type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleFiles} disabled={uploading} />
          <div className="border-2 border-dashed border-[#6750A4]/40 bg-[#FFFBFE] rounded-2xl py-6 flex flex-col items-center gap-2 hover:border-[#6750A4] hover:bg-[#E8DEF8]/30 transition-colors">
            <div className="w-12 h-12 rounded-full bg-[#E8DEF8] flex items-center justify-center">
              {uploading ? (
                <Loader2 className="w-6 h-6 text-[#6750A4] animate-spin" />
              ) : multiple && urls.length > 0 ? (
                <Plus className="w-6 h-6 text-[#6750A4]" />
              ) : (
                <Camera className="w-6 h-6 text-[#6750A4]" />
              )}
            </div>
            <span className="text-sm font-medium text-[#6750A4]">
              {uploading ? "Subiendo..." : multiple && urls.length > 0 ? "Añadir más" : label}
            </span>
            {hint && <span className="text-xs text-[#79747E]">{hint}</span>}
          </div>
        </label>
      )}
    </div>
  )
}
