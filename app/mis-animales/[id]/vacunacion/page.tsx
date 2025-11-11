"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Calendar, Check, FileText, Syringe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "@/components/ui/textarea"

type Vaccination = {
  id: string
  vaccine_name: string
  vaccine_type: string
  administration_date: string
  next_dose_date: string
  batch_number: string
  veterinary_clinic: string
  label_photo_url: string
  notes: string
  completed: boolean
}

export default function VacunacionPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [showForm, setShowForm] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    vaccine_name: "",
    vaccine_type: "obligatoria",
    administration_date: "",
    next_dose_date: "",
    batch_number: "",
    veterinary_clinic: "",
    label_photo_url: "",
    notes: "",
  })

  useEffect(() => {
    loadVaccinations()
  }, [petId])

  const loadVaccinations = async () => {
    try {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from("pet_vaccinations")
        .select("*")
        .eq("pet_id", petId)
        .order("next_dose_date", { ascending: true })

      if (error) throw error

      setVaccinations(data || [])
    } catch (error) {
      console.error("Error loading vaccinations:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las vacunas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formDataUpload,
      })

      if (!response.ok) throw new Error("Upload failed")

      const { url } = await response.json()
      setFormData((prev) => ({ ...prev, label_photo_url: url }))

      toast({
        title: "Foto subida",
        description: "La foto de la etiqueta se ha subido correctamente",
      })
    } catch (error) {
      console.error("Error uploading:", error)
      toast({
        title: "Error",
        description: "No se pudo subir la foto",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveVaccination = async () => {
    if (!formData.vaccine_name || !formData.administration_date) {
      toast({
        title: "Campos requeridos",
        description: "Completa el nombre de la vacuna y fecha de administración",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("pet_vaccinations").insert({
        ...formData,
        pet_id: petId,
        completed: false,
      })

      if (error) throw error

      toast({
        title: "Vacuna añadida",
        description: "La vacuna se ha guardado correctamente",
      })

      setFormData({
        vaccine_name: "",
        vaccine_type: "obligatoria",
        administration_date: "",
        next_dose_date: "",
        batch_number: "",
        veterinary_clinic: "",
        label_photo_url: "",
        notes: "",
      })
      setShowForm(false)
      loadVaccinations()
    } catch (error) {
      console.error("Error saving:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar la vacuna",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const toggleCompleted = async (id: string, completed: boolean) => {
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("pet_vaccinations").update({ completed: !completed }).eq("id", id)

      if (error) throw error

      loadVaccinations()
    } catch (error) {
      console.error("Error updating:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado",
        variant: "destructive",
      })
    }
  }

  const addToCalendar = (vaccination: Vaccination) => {
    if (!vaccination.next_dose_date) return

    const date = new Date(vaccination.next_dose_date)
    const title = `Vacuna ${vaccination.vaccine_name}`
    const details = `Próxima dosis de ${vaccination.vaccine_name}`

    const googleCalendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title,
    )}&details=${encodeURIComponent(details)}&dates=${date.toISOString().replace(/[-:]/g, "").split(".")[0]}Z/${
      date.toISOString().replace(/[-:]/g, "").split(".")[0]
    }Z`

    window.open(googleCalendarUrl, "_blank")
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
            <Syringe className="w-5 h-5 text-[#6750A4]" />
          </div>
          <h1 className="font-bold text-lg">Vacunación</h1>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Añadir
        </Button>
      </div>

      {showForm && (
        <div className="mb-6 p-4 border rounded-lg space-y-4">
          <h3 className="font-semibold">Nueva Vacuna</h3>

          <div>
            <Label htmlFor="vaccine_name">Nombre de la Vacuna</Label>
            <Input
              id="vaccine_name"
              value={formData.vaccine_name}
              onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
              placeholder="Ej: Rabia, Parvovirus"
            />
          </div>

          <div>
            <Label htmlFor="vaccine_type">Tipo</Label>
            <Select
              value={formData.vaccine_type}
              onValueChange={(value) => setFormData({ ...formData, vaccine_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="obligatoria">Obligatoria</SelectItem>
                <SelectItem value="opcional">Opcional</SelectItem>
                <SelectItem value="refuerzo">Refuerzo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="administration_date">Fecha de Administración</Label>
            <Input
              id="administration_date"
              type="date"
              value={formData.administration_date}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  administration_date: e.target.value,
                })
              }
            />
          </div>

          <div>
            <Label htmlFor="next_dose_date">Próxima Dosis</Label>
            <Input
              id="next_dose_date"
              type="date"
              value={formData.next_dose_date}
              onChange={(e) => setFormData({ ...formData, next_dose_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="batch_number">Número de Lote</Label>
            <Input
              id="batch_number"
              value={formData.batch_number}
              onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
              placeholder="Opcional"
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
            <Label htmlFor="label_photo">Foto de la Etiqueta</Label>
            <Input id="label_photo" type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} />
            {formData.label_photo_url && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 bg-transparent"
                onClick={() => window.open(formData.label_photo_url, "_blank")}
              >
                <FileText className="h-4 w-4 mr-2" />
                Ver Foto
              </Button>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones adicionales"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleSaveVaccination} disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {vaccinations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No hay vacunas registradas</div>
        ) : (
          vaccinations.map((vaccination) => (
            <div key={vaccination.id} className="p-4 border rounded-lg space-y-2">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{vaccination.vaccine_name}</h3>
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10">{vaccination.vaccine_type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Administrada: {new Date(vaccination.administration_date).toLocaleDateString()}
                  </p>
                  {vaccination.next_dose_date && (
                    <p className="text-sm text-muted-foreground">
                      Próxima dosis: {new Date(vaccination.next_dose_date).toLocaleDateString()}
                    </p>
                  )}
                  {vaccination.veterinary_clinic && (
                    <p className="text-sm text-muted-foreground">{vaccination.veterinary_clinic}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCompleted(vaccination.id, vaccination.completed)}
                >
                  <Check className={`h-5 w-5 ${vaccination.completed ? "text-green-600" : "text-gray-300"}`} />
                </Button>
              </div>

              {vaccination.next_dose_date && (
                <Button variant="outline" size="sm" onClick={() => addToCalendar(vaccination)}>
                  <Calendar className="h-4 w-4 mr-2" />
                  Añadir al Calendario
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
