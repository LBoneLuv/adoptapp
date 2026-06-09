"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Copy, FileText, Check, Pencil, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { DocUpload } from "@/components/doc-upload"

const inputCls =
  "w-full px-4 py-3 bg-[#FEF7FF] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
const labelCls = "block text-sm font-medium text-[#49454F] mb-2"

export default function MicrochipPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
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
    } finally {
      setLoading(false)
    }
  }

  const handleCopyChipNumber = async () => {
    if (!formData.chip_number) return
    try {
      await navigator.clipboard.writeText(formData.chip_number)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast({ title: "Error", description: "No se pudo copiar", variant: "destructive" })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createBrowserClient()
      const { data: existing } = await supabase.from("pet_microchips").select("id").eq("pet_id", petId).maybeSingle()
      if (existing) {
        const { error } = await supabase.from("pet_microchips").update(formData).eq("pet_id", petId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("pet_microchips").insert({ ...formData, pet_id: petId })
        if (error) throw error
      }
      toast({ title: "Guardado", description: "Información del microchip guardada" })
      setIsEditing(false)
      loadMicrochipData()
    } catch (error) {
      console.error("Error saving:", error)
      toast({ title: "Error", description: "No se pudo guardar", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FEF7FF]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6750A4]" />
      </div>
    )
  }

  const Row = ({ label, value }: { label: string; value: string }) =>
    value ? (
      <div className="py-2 border-b border-[#E8DEF8] last:border-0">
        <p className="text-xs text-[#79747E]">{label}</p>
        <p className="text-sm text-[#1C1B1F] font-medium mt-0.5">{value}</p>
      </div>
    ) : null

  return (
    <div className="min-h-screen bg-[#FEF7FF] p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-[#6750A4]" />
          </button>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#6750A4]" />
            <h1 className="font-bold text-lg text-[#1C1B1F]">Microchip</h1>
          </div>
        </div>
        {hasData && !isEditing && (
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
            className="border-[#6750A4] text-[#6750A4] rounded-full h-10 bg-transparent"
          >
            <Pencil className="h-4 w-4 mr-1" /> Editar
          </Button>
        )}
      </div>

      {!isEditing && hasData ? (
        <div className="space-y-4">
          {/* Chip number highlight */}
          <div className="bg-[#6750A4] rounded-3xl p-5 text-white shadow-md">
            <p className="text-xs text-white/80 mb-1">Número de microchip</p>
            <div className="flex items-center justify-between gap-2">
              <p className="text-xl font-bold tracking-wide break-all">{formData.chip_number}</p>
              <button onClick={handleCopyChipNumber} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
              </button>
            </div>
          </div>

          <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
            <Row label="Fecha de implantación" value={formData.implant_date ? new Date(formData.implant_date).toLocaleDateString() : ""} />
            <Row label="Localización del chip" value={formData.chip_location} />
            <Row label="Registro" value={formData.registry_name} />
            <Row label="Clínica veterinaria" value={formData.veterinary_clinic} />
          </div>

          {formData.document_url && (
            <Button
              variant="outline"
              className="w-full border-[#6750A4] text-[#6750A4] rounded-full h-11 bg-transparent"
              onClick={() => window.open(formData.document_url, "_blank")}
            >
              <FileText className="h-4 w-4 mr-2" /> Ver documento
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 space-y-4">
          <div>
            <label className={labelCls}>Número de microchip *</label>
            <input
              value={formData.chip_number}
              onChange={(e) => setFormData({ ...formData, chip_number: e.target.value })}
              placeholder="Ej: 981000000123456"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Fecha de implantación</label>
            <input
              type="date"
              value={formData.implant_date}
              onChange={(e) => setFormData({ ...formData, implant_date: e.target.value })}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Localización del chip</label>
            <input
              value={formData.chip_location}
              onChange={(e) => setFormData({ ...formData, chip_location: e.target.value })}
              placeholder="Ej: Lado izquierdo del cuello"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Registro</label>
            <input
              value={formData.registry_name}
              onChange={(e) => setFormData({ ...formData, registry_name: e.target.value })}
              placeholder="Ej: REIAC, ANICOM"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Clínica veterinaria</label>
            <input
              value={formData.veterinary_clinic}
              onChange={(e) => setFormData({ ...formData, veterinary_clinic: e.target.value })}
              placeholder="Nombre de la clínica"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Documento del chip</label>
            <DocUpload
              value={formData.document_url}
              onChange={(url) => setFormData({ ...formData, document_url: url as string })}
              label="Subir documento"
              hint="Imagen o PDF"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 font-semibold disabled:opacity-50"
              onClick={handleSave}
              disabled={saving || !formData.chip_number}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            {hasData && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  loadMicrochipData()
                }}
                className="border-[#79747E] text-[#49454F] rounded-full h-11 bg-transparent"
              >
                Cancelar
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
