"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Phone, Mail, FileText, Pencil, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { DocUpload } from "@/components/doc-upload"

const inputCls =
  "w-full px-4 py-3 bg-[#FEF7FF] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
const labelCls = "block text-sm font-medium text-[#49454F] mb-2"

export default function SeguroPage() {
  const router = useRouter()
  const params = useParams()
  const petId = params.id as string
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [hasData, setHasData] = useState(false)

  const [formData, setFormData] = useState({
    insurance_company: "",
    policy_number: "",
    coverage_type: "",
    start_date: "",
    renewal_date: "",
    claims_phone: "",
    customer_service_phone: "",
    customer_service_email: "",
    policy_document_url: "",
  })

  useEffect(() => {
    loadInsuranceData()
  }, [petId])

  const loadInsuranceData = async () => {
    try {
      const supabase = createBrowserClient()
      const { data: insurance, error } = await supabase
        .from("pet_insurances")
        .select("*")
        .eq("pet_id", petId)
        .maybeSingle()
      if (error) throw error
      if (insurance) {
        setFormData({
          insurance_company: insurance.insurance_company || "",
          policy_number: insurance.policy_number || "",
          coverage_type: insurance.coverage_type || "",
          start_date: insurance.start_date || "",
          renewal_date: insurance.renewal_date || "",
          claims_phone: insurance.claims_phone || "",
          customer_service_phone: insurance.customer_service_phone || "",
          customer_service_email: insurance.customer_service_email || "",
          policy_document_url: insurance.policy_document_url || "",
        })
        setHasData(true)
        setIsEditing(false)
      } else {
        setHasData(false)
        setIsEditing(true)
      }
    } catch (error) {
      console.error("Error loading insurance:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createBrowserClient()
      const { data: existing } = await supabase.from("pet_insurances").select("id").eq("pet_id", petId).maybeSingle()
      if (existing) {
        const { error } = await supabase.from("pet_insurances").update(formData).eq("pet_id", petId)
        if (error) throw error
      } else {
        const { error } = await supabase.from("pet_insurances").insert({ ...formData, pet_id: petId })
        if (error) throw error
      }
      toast({ title: "Guardado", description: "Seguro guardado correctamente" })
      setIsEditing(false)
      loadInsuranceData()
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
            <Shield className="w-5 h-5 text-[#6750A4]" />
            <h1 className="font-bold text-lg text-[#1C1B1F]">Seguro</h1>
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
            <Row label="Compañía aseguradora" value={formData.insurance_company} />
            <Row label="Número de póliza" value={formData.policy_number} />
            <Row label="Tipo de cobertura" value={formData.coverage_type} />
            <Row label="Fecha de inicio" value={formData.start_date ? new Date(formData.start_date).toLocaleDateString() : ""} />
            <Row label="Fecha de renovación" value={formData.renewal_date ? new Date(formData.renewal_date).toLocaleDateString() : ""} />
          </div>

          {/* Acciones rápidas */}
          <div className="grid grid-cols-2 gap-3">
            {formData.claims_phone && (
              <a href={`tel:${formData.claims_phone}`} className="flex flex-col items-center gap-1 bg-[#FFFBFE] rounded-2xl py-3 shadow-sm">
                <Phone className="w-5 h-5 text-[#6750A4]" />
                <span className="text-xs font-medium text-[#1C1B1F]">Siniestros</span>
              </a>
            )}
            {formData.customer_service_phone && (
              <a href={`tel:${formData.customer_service_phone}`} className="flex flex-col items-center gap-1 bg-[#FFFBFE] rounded-2xl py-3 shadow-sm">
                <Phone className="w-5 h-5 text-[#6750A4]" />
                <span className="text-xs font-medium text-[#1C1B1F]">Atención cliente</span>
              </a>
            )}
            {formData.customer_service_email && (
              <a href={`mailto:${formData.customer_service_email}`} className="flex flex-col items-center gap-1 bg-[#FFFBFE] rounded-2xl py-3 shadow-sm">
                <Mail className="w-5 h-5 text-[#6750A4]" />
                <span className="text-xs font-medium text-[#1C1B1F]">Email</span>
              </a>
            )}
            {formData.policy_document_url && (
              <button onClick={() => window.open(formData.policy_document_url, "_blank")} className="flex flex-col items-center gap-1 bg-[#FFFBFE] rounded-2xl py-3 shadow-sm">
                <FileText className="w-5 h-5 text-[#6750A4]" />
                <span className="text-xs font-medium text-[#1C1B1F]">Ver póliza</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-[#FFFBFE] rounded-3xl shadow-md p-4 space-y-4">
          <div>
            <label className={labelCls}>Compañía aseguradora *</label>
            <input value={formData.insurance_company} onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })} placeholder="Nombre de la aseguradora" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Número de póliza</label>
            <input value={formData.policy_number} onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })} placeholder="Número de póliza" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Tipo de cobertura</label>
            <input value={formData.coverage_type} onChange={(e) => setFormData({ ...formData, coverage_type: e.target.value })} placeholder="Ej: Responsabilidad civil, Completo" className={inputCls} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Inicio</label>
              <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Renovación</label>
              <input type="date" value={formData.renewal_date} onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Teléfono de siniestros</label>
            <input value={formData.claims_phone} onChange={(e) => setFormData({ ...formData, claims_phone: e.target.value })} placeholder="+34 XXX XXX XXX" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Teléfono de atención al cliente</label>
            <input value={formData.customer_service_phone} onChange={(e) => setFormData({ ...formData, customer_service_phone: e.target.value })} placeholder="+34 XXX XXX XXX" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email de atención al cliente</label>
            <input type="email" value={formData.customer_service_email} onChange={(e) => setFormData({ ...formData, customer_service_email: e.target.value })} placeholder="email@aseguradora.com" className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Documento de la póliza</label>
            <DocUpload
              value={formData.policy_document_url}
              onChange={(url) => setFormData({ ...formData, policy_document_url: url as string })}
              accept=".pdf,image/*"
              label="Subir póliza"
              hint="PDF o imagen"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <Button
              className="flex-1 bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-11 font-semibold disabled:opacity-50"
              onClick={handleSave}
              disabled={saving || !formData.insurance_company}
            >
              {saving ? "Guardando..." : "Guardar"}
            </Button>
            {hasData && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false)
                  loadInsuranceData()
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
