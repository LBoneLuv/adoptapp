"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, FileText, Share2, Pencil, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { DocUpload } from "@/components/doc-upload"

const inputCls =
  "w-full px-4 py-3 bg-[#FEF7FF] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
const labelCls = "block text-sm font-medium text-[#49454F] mb-2"

export default function CartillaPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    if (formData.document_urls.length === 0) {
      toast({ title: "No hay documentos", description: "Sube al menos un documento", variant: "destructive" })
      return
    }
    const text = `Cartilla Veterinaria\nNúmero: ${formData.passport_number}\nDocumentos: ${formData.document_urls.join("\n")}`
    if (navigator.share) {
      try {
        await navigator.share({ title: "Cartilla Veterinaria", text })
      } catch {
        /* cancelado */
      }
    } else {
      await navigator.clipboard.writeText(text)
      toast({ title: "Copiado", description: "Información copiada al portapapeles" })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createBrowserClient()
      const { data: existing } = await supabase.from("pet_passports").select("id").eq("pet_id", petId).maybeSingle()
      if (existing) {
        const { error } = await supabase.from("pet_passports").update(formData).eq("pet_id", petId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("pet_passports").insert({ ...formData, pet_id: petId })
        if (error) throw error
      }
      toast({ title: "Guardado", description: "Cartilla guardada correctamente" })
      setIsEditing(false)
      loadPassportData()
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center">
            <ArrowLeft className="h-5 w-5 text-[#6750A4]" />
          </button>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#6750A4]" />
            <h1 className="font-bold text-lg text-[#1C1B1F]">Cartilla</h1>
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
          <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
            <Row label="Número de pasaporte/cartilla" value={formData.passport_number} />
            <Row label="Fecha de emisión" value={formData.issue_date ? new Date(formData.issue_date).toLocaleDateString() : ""} />
            <Row label="Fecha de caducidad" value={formData.expiry_date ? new Date(formData.expiry_date).toLocaleDateString() : ""} />
            <Row label="Veterinario emisor" value={formData.issuing_vet} />
            <Row label="Clínica emisora" value={formData.issuing_clinic} />
          </div>

          {formData.document_urls.length > 0 && (
            <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4">
              <p className="text-sm font-bold text-[#1C1B1F] mb-3">Documentos ({formData.document_urls.length})</p>
              <div className="grid grid-cols-3 gap-3">
                {formData.document_urls.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => window.open(url, "_blank")}
                    className="h-24 rounded-2xl bg-[#E8DEF8] flex flex-col items-center justify-center gap-1"
                  >
                    <Eye className="w-6 h-6 text-[#6750A4]" />
                    <span className="text-[10px] text-[#6750A4] font-medium">Doc {i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            className="w-full border-[#6750A4] text-[#6750A4] rounded-full h-11 bg-transparent"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 mr-2" /> Compartir cartilla
          </Button>
        </div>
      ) : (
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 space-y-4">
          <div>
            <label className={labelCls}>Número de pasaporte/cartilla *</label>
            <input
              value={formData.passport_number}
              onChange={(e) => setFormData({ ...formData, passport_number: e.target.value })}
              placeholder="Número de identificación"
              className={inputCls}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha de emisión</label>
              <input type="date" value={formData.issue_date} onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Caducidad</label>
              <input type="date" value={formData.expiry_date} onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Veterinario emisor</label>
            <input value={formData.issuing_vet} onChange={(e) => setFormData({ ...formData, issuing_vet: e.target.value })} placeholder="Nombre del veterinario" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Clínica emisora</label>
            <input value={formData.issuing_clinic} onChange={(e) => setFormData({ ...formData, issuing_clinic: e.target.value })} placeholder="Nombre de la clínica" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Documentos</label>
            <DocUpload
              value={formData.document_urls}
              onChange={(urls) => setFormData({ ...formData, document_urls: urls as string[] })}
              multiple
              label="Subir documentos"
              hint="Imágenes o PDF de la cartilla"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 font-semibold disabled:opacity-50"
              onClick={handleSave}
              disabled={saving || !formData.passport_number}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            {hasData && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  loadPassportData()
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
