"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Calendar, Check, Syringe, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { DocUpload } from "@/components/doc-upload"

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

const inputCls =
  "w-full px-4 py-3 bg-[#FEF7FF] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
const labelCls = "block text-sm font-medium text-[#49454F] mb-2"

const TYPE_STYLES: Record<string, string> = {
  obligatoria: "bg-[#FDECEA] text-[#C5221F]",
  refuerzo: "bg-[#FFF4E5] text-[#B26A00]",
  opcional: "bg-[#E8DEF8] text-[#6750A4]",
}

export default function VacunacionPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  const empty = {
    vaccine_name: "",
    vaccine_type: "obligatoria",
    administration_date: "",
    next_dose_date: "",
    batch_number: "",
    veterinary_clinic: "",
    label_photo_url: "",
    notes: "",
  }
  const [formData, setFormData] = useState(empty)

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
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVaccination = async () => {
    if (!formData.vaccine_name || !formData.administration_date) {
      toast({
        title: "Campos requeridos",
        description: "Completa el nombre de la vacuna y la fecha de administración",
        variant: "destructive",
      })
      return
    }
    setSaving(true)
    try {
      const supabase = createBrowserClient()
      const { error } = await supabase.from("pet_vaccinations").insert({ ...formData, pet_id: petId, completed: false })
      if (error) throw error
      toast({ title: "Vacuna añadida", description: "Se ha guardado correctamente" })
      setFormData(empty)
      setShowForm(false)
      loadVaccinations()
    } catch (error) {
      console.error("Error saving:", error)
      toast({ title: "Error", description: "No se pudo guardar la vacuna", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const toggleCompleted = async (id: string, completed: boolean) => {
    try {
      const supabase = createBrowserClient()
      await supabase.from("pet_vaccinations").update({ completed: !completed }).eq("id", id)
      loadVaccinations()
    } catch (error) {
      console.error("Error updating:", error)
    }
  }

  const addToCalendar = (vaccination: Vaccination) => {
    if (!vaccination.next_dose_date) return
    const date = new Date(vaccination.next_dose_date)
    const stamp = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      `Vacuna ${vaccination.vaccine_name}`,
    )}&details=${encodeURIComponent(`Próxima dosis de ${vaccination.vaccine_name}`)}&dates=${stamp}/${stamp}`
    window.open(url, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FEF7FF] p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-[#6750A4]" />
          </button>
          <div className="flex items-center gap-2">
            <Syringe className="w-5 h-5 text-[#6750A4]" />
            <h1 className="font-bold text-lg text-[#1C1B1F]">Vacunación</h1>
          </div>
        </div>
        <Button
          onClick={() => setShowForm((s) => !s)}
          className="bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-10"
        >
          {showForm ? <X className="h-4 w-4 mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          {showForm ? "Cerrar" : "Añadir"}
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 mb-6 space-y-4">
          <h3 className="font-bold text-[#1C1B1F]">Nueva vacuna</h3>

          <div>
            <label className={labelCls}>Nombre de la vacuna *</label>
            <input
              value={formData.vaccine_name}
              onChange={(e) => setFormData({ ...formData, vaccine_name: e.target.value })}
              placeholder="Ej: Rabia, Parvovirus"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {["obligatoria", "refuerzo", "opcional"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({ ...formData, vaccine_type: t })}
                  className={`py-2.5 rounded-2xl text-sm font-medium capitalize transition-colors ${
                    formData.vaccine_type === t ? "bg-[#6750A4] text-white" : "bg-[#E8DEF8] text-[#6750A4]"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Administración *</label>
              <input
                type="date"
                value={formData.administration_date}
                onChange={(e) => setFormData({ ...formData, administration_date: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Próxima dosis</label>
              <input
                type="date"
                value={formData.next_dose_date}
                onChange={(e) => setFormData({ ...formData, next_dose_date: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Nº de lote</label>
              <input
                value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                placeholder="Opcional"
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Clínica</label>
              <input
                value={formData.veterinary_clinic}
                onChange={(e) => setFormData({ ...formData, veterinary_clinic: e.target.value })}
                placeholder="Opcional"
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Foto de la etiqueta</label>
            <DocUpload
              value={formData.label_photo_url}
              onChange={(url) => setFormData({ ...formData, label_photo_url: url as string })}
              accept="image/*"
              label="Foto de la etiqueta"
              hint="Imagen de la vacuna o cartilla"
            />
          </div>

          <div>
            <label className={labelCls}>Notas</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Observaciones adicionales"
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          <Button
            onClick={handleSaveVaccination}
            disabled={saving}
            className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 font-semibold disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar vacuna"}
          </Button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {vaccinations.length === 0 && !showForm ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#E8DEF8] flex items-center justify-center mx-auto mb-3">
              <Syringe className="w-8 h-8 text-[#6750A4]" />
            </div>
            <p className="text-[#49454F]">No hay vacunas registradas</p>
            <p className="text-[#79747E] text-sm mt-1">Pulsa “Añadir” para registrar la primera</p>
          </div>
        ) : (
          vaccinations.map((v) => (
            <div key={v.id} className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-[#1C1B1F]">{v.vaccine_name}</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${TYPE_STYLES[v.vaccine_type] || TYPE_STYLES.opcional}`}>
                      {v.vaccine_type}
                    </span>
                  </div>
                  <p className="text-sm text-[#49454F] mt-1">
                    Administrada: {new Date(v.administration_date).toLocaleDateString()}
                  </p>
                  {v.next_dose_date && (
                    <p className="text-sm text-[#6750A4] font-medium">
                      Próxima dosis: {new Date(v.next_dose_date).toLocaleDateString()}
                    </p>
                  )}
                  {v.veterinary_clinic && <p className="text-xs text-[#79747E] mt-0.5">{v.veterinary_clinic}</p>}
                </div>
                <button
                  onClick={() => toggleCompleted(v.id, v.completed)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    v.completed ? "bg-[#E6F4EA]" : "bg-[#F5F5F5]"
                  }`}
                  title={v.completed ? "Completada" : "Marcar como completada"}
                >
                  <Check className={`h-5 w-5 ${v.completed ? "text-[#1E7E34]" : "text-[#B0B0B0]"}`} />
                </button>
              </div>

              {v.notes && <p className="text-sm text-[#49454F] mt-2 whitespace-pre-wrap">{v.notes}</p>}

              {v.next_dose_date && (
                <button
                  onClick={() => addToCalendar(v)}
                  className="mt-3 flex items-center gap-2 text-sm text-[#6750A4] font-medium bg-[#E8DEF8] rounded-full px-4 py-2 hover:bg-[#D0BCFF] transition-colors"
                >
                  <Calendar className="h-4 w-4" /> Añadir al calendario
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
