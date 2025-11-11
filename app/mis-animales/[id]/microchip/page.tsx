"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Copy, FileText, Check, Edit, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function MicrochipPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasData, setHasData] = useState(false)

  const [formData, setFormData] = useState({
    chip_number: "",
    implant_date: "",
    chip_location: "",
    registry_name: "",
    veterinary_clinic: "",
    document_url: "",
  })

  useEffect(() => {
    loadMicrochipData()
  }, [petId])

  const loadMicrochipData = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: microchip, error } = await supabase
        .from("pet_microchips")
        .select("*")
        .eq("pet_id", petId)
        .maybeSingle()

      if (error) throw error

      if (microchip) {
        setFormData({
          chip_number: microchip.chip_number || "",
          implant_date: microchip.implant_date || "",
          chip_location: microchip.chip_location || "",
          registry_name: microchip.registry_name || "",
          veterinary_clinic: microchip.veterinary_clinic || "",
          document_url: microchip.document_url || "",
        })
        setHasData(true)
        setIsEditing(false)
      } else {
        setHasData(false)
        setIsEditing(true)
      }
    } catch (error) {
      console.error("Error loading microchip:", error)
      toast({
        title: "Error",
        description: "No se pudo cargar la información del microchip",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCopyChipNumber = async () => {
    if (!formData.chip_number) return

    try {
      await navigator.clipboard.writeText(formData.chip_number)
      setCopied(true)
      toast({
        title: "Copiado",
        description: "Número de microchip copiado al portapapeles",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar el número",
        variant: "destructive",
      })
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()
      setFormData((prev) => ({ ...prev, document_url: url }))

      toast({
        title: "Documento subido",
        description: "El documento se ha subido correctamente",
      })
    } catch (error) {
      console.error("Error uploading:", error)
      toast({
        title: "Error",
        description: "No se pudo subir el documento",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
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

      const { data: existing } = await supabase.from("pet_microchips").select("id").eq("pet_id", petId).maybeSingle()

      if (existing) {
        const { error } = await supabase.from("pet_microchips").update(formData).eq("pet_id", petId)

        if (error) throw error
      } else {
        const { error } = await supabase.from("pet_microchips").insert({ ...formData, pet_id: petId })

        if (error) throw error
      }

      toast({
        title: "Guardado",
        description: "Información del microchip guardada correctamente",
      })

      setIsEditing(false)
      loadMicrochipData()
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
            <Cpu className="w-5 h-5 text-[#6750A4]" />
          </div>
          <h1 className="font-bold text-lg">Microchip</h1>
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
              <Label className="text-muted-foreground">Número de Microchip</Label>
              <div className="flex items-center justify-between mt-1">
                <p className="font-medium">{formData.chip_number}</p>
                <Button variant="ghost" size="icon" onClick={handleCopyChipNumber}>
                  {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {formData.implant_date && (
              <div>
                <Label className="text-muted-foreground">Fecha de Implantación</Label>
                <p className="mt-1">{new Date(formData.implant_date).toLocaleDateString()}</p>
              </div>
            )}

            {formData.chip_location && (
              <div>
                <Label className="text-muted-foreground">Localización del Chip</Label>
                <p className="mt-1">{formData.chip_location}</p>
              </div>
            )}

            {formData.registry_name && (
              <div>
                <Label className="text-muted-foreground">Registro</Label>
                <p className="mt-1">{formData.registry_name}</p>
              </div>
            )}

            {formData.veterinary_clinic && (
              <div>
                <Label className="text-muted-foreground">Clínica Veterinaria</Label>
                <p className="mt-1">{formData.veterinary_clinic}</p>
              </div>
            )}

            {formData.document_url && (
              <div>
                <Label className="text-muted-foreground">Documento</Label>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent"
                  onClick={() => window.open(formData.document_url, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Documento
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="chip_number">Número de Microchip</Label>
            <Input
              id="chip_number"
              value={formData.chip_number}
              onChange={(e) => setFormData({ ...formData, chip_number: e.target.value })}
              placeholder="Ej: 981000000123456"
            />
          </div>

          <div>
            <Label htmlFor="implant_date">Fecha de Implantación</Label>
            <Input
              id="implant_date"
              type="date"
              value={formData.implant_date}
              onChange={(e) => setFormData({ ...formData, implant_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="chip_location">Localización del Chip</Label>
            <Input
              id="chip_location"
              value={formData.chip_location}
              onChange={(e) => setFormData({ ...formData, chip_location: e.target.value })}
              placeholder="Ej: Lado izquierdo del cuello"
            />
          </div>

          <div>
            <Label htmlFor="registry_name">Registro</Label>
            <Input
              id="registry_name"
              value={formData.registry_name}
              onChange={(e) => setFormData({ ...formData, registry_name: e.target.value })}
              placeholder="Ej: REIAC, ANICOM"
            />
          </div>

          <div>
            <Label htmlFor="veterinary_clinic">Clínica Veterinaria</Label>
            <Input
              id="veterinary_clinic"
              value={formData.veterinary_clinic}
              onChange={(e) => setFormData({ ...formData, veterinary_clinic: e.target.value })}
              placeholder="Nombre de la clínica"
            />
          </div>

          <div>
            <Label htmlFor="document">Documento del Chip</Label>
            <div className="space-y-2">
              <Input
                id="document"
                type="file"
                accept="image/*,.pdf"
                onChange={handleDocumentUpload}
                disabled={uploading}
              />
              {formData.document_url && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => window.open(formData.document_url, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Documento
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving || !formData.chip_number}>
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
