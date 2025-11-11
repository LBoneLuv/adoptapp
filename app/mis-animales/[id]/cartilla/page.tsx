"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, FileText, Share2, X, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function CartillaPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasData, setHasData] = useState(false)

  const [formData, setFormData] = useState({
    passport_number: "",
    issue_date: "",
    expiry_date: "",
    issuing_vet: "",
    issuing_clinic: "",
    document_urls: [] as string[],
  })

  useEffect(() => {
    loadPassportData()
  }, [petId])

  const loadPassportData = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: passport, error } = await supabase
        .from("pet_passports")
        .select("*")
        .eq("pet_id", petId)
        .maybeSingle()

      if (error) throw error

      if (passport) {
        setFormData({
          passport_number: passport.passport_number || "",
          issue_date: passport.issue_date || "",
          expiry_date: passport.expiry_date || "",
          issuing_vet: passport.issuing_vet || "",
          issuing_clinic: passport.issuing_clinic || "",
          document_urls: passport.document_urls || [],
        })
        setHasData(true)
        setIsEditing(false)
      } else {
        setHasData(false)
        setIsEditing(true)
      }
    } catch (error) {
      console.error("Error loading passport:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información de la cartilla",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploadedUrls: string[] = []

      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (!response.ok) throw new Error("Upload failed")

        const { url } = await response.json()
        uploadedUrls.push(url)
      }

      setFormData((prev) => ({
        ...prev,
        document_urls: [...prev.document_urls, ...uploadedUrls],
      }))

      toast({
        title: "Documentos subidos",
        description: `${uploadedUrls.length} documento(s) subido(s) correctamente`,
      })
    } catch (error) {
      console.error("Error uploading:", error)
      toast({
        title: "Error",
        description: "No se pudieron subir los documentos",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveDocument = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      document_urls: prev.document_urls.filter((_, i) => i !== index),
    }))
  }

  const handleShare = async () => {
    if (formData.document_urls.length === 0) {
      toast({
        title: "No hay documentos",
        description: "Sube al menos un documento para compartir",
        variant: "destructive",
      })
      return
    }

    const text = `Cartilla Veterinaria\nNúmero: ${formData.passport_number}\nDocumentos: ${formData.document_urls.join("\n")}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Cartilla Veterinaria",
          text: text,
        })
      } catch (error) {
        console.log("Share cancelled")
      }
    } else {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Copiado",
        description: "Información copiada al portapapeles",
      })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user")

      const { data: existing } = await supabase.from("pet_passports").select("id").eq("pet_id", petId).maybeSingle()

      if (existing) {
        const { error } = await supabase.from("pet_passports").update(formData).eq("pet_id", petId)

        if (error) throw error
      } else {
        const { error } = await supabase.from("pet_passports").insert({ ...formData, pet_id: petId })

        if (error) throw error
      }

      toast({
        title: "Guardado",
        description: "Información de la cartilla guardada correctamente",
      })

      setIsEditing(false)
      loadPassportData()
    } catch (error) {
      console.error("Error saving:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la información",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="bg-background p-4 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center ml-[-10px]">
            <FileText className="w-5 h-5 text-[#6750A4]" />
          </div>
          <h1 className="font-bold text-lg ml-0">Cartilla </h1>
        </div>
        {hasData && !isEditing && (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Button>
        )}
      </div>

      {!isEditing && hasData ? (
        <div className="space-y-4">
          <div className="p-4 border rounded-lg space-y-3">
            <div>
              <Label className="text-muted-foreground">Número de Pasaporte/Cartilla</Label>
              <p className="font-medium mt-1">{formData.passport_number}</p>
            </div>

            {formData.issue_date && (
              <div>
                <Label className="text-muted-foreground">Fecha de Emisión</Label>
                <p className="mt-1">{new Date(formData.issue_date).toLocaleDateString()}</p>
              </div>
            )}

            {formData.expiry_date && (
              <div>
                <Label className="text-muted-foreground">Fecha de Caducidad</Label>
                <p className="mt-1">{new Date(formData.expiry_date).toLocaleDateString()}</p>
              </div>
            )}

            {formData.issuing_vet && (
              <div>
                <Label className="text-muted-foreground">Veterinario Emisor</Label>
                <p className="mt-1">{formData.issuing_vet}</p>
              </div>
            )}

            {formData.issuing_clinic && (
              <div>
                <Label className="text-muted-foreground">Clínica Emisora</Label>
                <p className="mt-1">{formData.issuing_clinic}</p>
              </div>
            )}

            {formData.document_urls.length > 0 && (
              <div>
                <Label className="text-muted-foreground">Documentos ({formData.document_urls.length})</Label>
                <div className="space-y-2 mt-2">
                  {formData.document_urls.map((url, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="w-full bg-transparent justify-start"
                      onClick={() => window.open(url, "_blank")}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Documento {index + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" className="w-full bg-transparent" onClick={handleShare}>
            <Share2 className="h-4 w-4 mr-2" />
            Compartir Cartilla
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="passport_number">Número de Pasaporte/Cartilla</Label>
            <Input
              id="passport_number"
              value={formData.passport_number}
              onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
              placeholder="Número de identificación"
            />
          </div>

          <div>
            <Label htmlFor="issue_date">Fecha de Emisión</Label>
            <Input
              id="issue_date"
              type="date"
              value={formData.issue_date}
              onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="expiry_date">Fecha de Caducidad</Label>
            <Input
              id="expiry_date"
              type="date"
              value={formData.expiry_date}
              onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="issuing_vet">Veterinario Emisor</Label>
            <Input
              id="issuing_vet"
              value={formData.issuing_vet}
              onChange={(e) => setFormData({ ...formData, issuing_vet: e.target.value })}
              placeholder="Nombre del veterinario"
            />
          </div>

          <div>
            <Label htmlFor="issuing_clinic">Clínica Emisora</Label>
            <Input
              id="issuing_clinic"
              value={formData.issuing_clinic}
              onChange={(e) => setFormData({ ...formData, issuing_clinic: e.target.value })}
              placeholder="Nombre de la clínica"
            />
          </div>

          <div>
            <Label htmlFor="documents">Documentos</Label>
            <div className="space-y-2">
              <Input
                id="documents"
                type="file"
                accept="image/*,.pdf"
                multiple
                onChange={handleDocumentUpload}
                disabled={uploading}
              />
              {formData.document_urls.length > 0 && (
                <div className="space-y-2">
                  {formData.document_urls.map((url, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <FileText className="h-4 w-4" />
                      <span className="flex-1 text-sm truncate">Documento {index + 1}</span>
                      <Button variant="ghost" size="icon" onClick={() => window.open(url, "_blank")}>
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleRemoveDocument(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving || !formData.passport_number}>
              {saving ? "Guardando..." : "Guardar Información"}
            </Button>
            {hasData && (
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
