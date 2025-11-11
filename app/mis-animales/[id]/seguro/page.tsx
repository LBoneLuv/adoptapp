"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Phone, Mail, FileText, Edit, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createBrowserClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

export default function SeguroPage() {
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
      toast({
        title: "Error",
        description: "No se pudo cargar la información del seguro",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setFormData((prev) => ({ ...prev, policy_document_url: url }))

      toast({
        title: "Documento subido",
        description: "La póliza se ha subido correctamente",
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

  const handleCall = (phone: string) => {
    if (!phone) return
    window.location.href = `tel:${phone}`
  }

  const handleEmail = (email: string) => {
    if (!email) return
    window.location.href = `mailto:${email}`
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) throw new Error("No user")

      const { data: existing } = await supabase.from("pet_insurances").select("id").eq("pet_id", petId).maybeSingle()

      if (existing) {
        const { error } = await supabase.from("pet_insurances").update(formData).eq("pet_id", petId)

        if (error) throw error
      } else {
        const { error } = await supabase.from("pet_insurances").insert({ ...formData, pet_id: petId })

        if (error) throw error
      }

      toast({
        title: "Guardado",
        description: "Información del seguro guardada correctamente",
      })

      setIsEditing(false)
      loadInsuranceData()
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
            <Shield className="w-5 h-5 text-[#6750A4]" />
          </div>
          <h1 className="font-bold text-lg">Seguro</h1>
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
              <Label className="text-muted-foreground">Compañía Aseguradora</Label>
              <p className="font-medium mt-1">{formData.insurance_company}</p>
            </div>

            {formData.policy_number && (
              <div>
                <Label className="text-muted-foreground">Número de Póliza</Label>
                <p className="mt-1">{formData.policy_number}</p>
              </div>
            )}

            {formData.coverage_type && (
              <div>
                <Label className="text-muted-foreground">Tipo de Cobertura</Label>
                <p className="mt-1">{formData.coverage_type}</p>
              </div>
            )}

            {formData.start_date && (
              <div>
                <Label className="text-muted-foreground">Fecha de Inicio</Label>
                <p className="mt-1">{new Date(formData.start_date).toLocaleDateString()}</p>
              </div>
            )}

            {formData.renewal_date && (
              <div>
                <Label className="text-muted-foreground">Fecha de Renovación</Label>
                <p className="mt-1">{new Date(formData.renewal_date).toLocaleDateString()}</p>
              </div>
            )}

            {formData.claims_phone && (
              <div>
                <Label className="text-muted-foreground">Teléfono de Siniestros</Label>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent justify-start"
                  onClick={() => handleCall(formData.claims_phone)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {formData.claims_phone}
                </Button>
              </div>
            )}

            {formData.customer_service_phone && (
              <div>
                <Label className="text-muted-foreground">Teléfono de Atención al Cliente</Label>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent justify-start"
                  onClick={() => handleCall(formData.customer_service_phone)}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  {formData.customer_service_phone}
                </Button>
              </div>
            )}

            {formData.customer_service_email && (
              <div>
                <Label className="text-muted-foreground">Email de Atención al Cliente</Label>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent justify-start"
                  onClick={() => handleEmail(formData.customer_service_email)}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  {formData.customer_service_email}
                </Button>
              </div>
            )}

            {formData.policy_document_url && (
              <div>
                <Label className="text-muted-foreground">Documento de la Póliza</Label>
                <Button
                  variant="outline"
                  className="w-full mt-2 bg-transparent"
                  onClick={() => window.open(formData.policy_document_url, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Póliza
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="insurance_company">Compañía Aseguradora</Label>
            <Input
              id="insurance_company"
              value={formData.insurance_company}
              onChange={(e) => setFormData({ ...formData, insurance_company: e.target.value })}
              placeholder="Nombre de la aseguradora"
            />
          </div>

          <div>
            <Label htmlFor="policy_number">Número de Póliza</Label>
            <Input
              id="policy_number"
              value={formData.policy_number}
              onChange={(e) => setFormData({ ...formData, policy_number: e.target.value })}
              placeholder="Número de póliza"
            />
          </div>

          <div>
            <Label htmlFor="coverage_type">Tipo de Cobertura</Label>
            <Input
              id="coverage_type"
              value={formData.coverage_type}
              onChange={(e) => setFormData({ ...formData, coverage_type: e.target.value })}
              placeholder="Ej: Responsabilidad Civil, Completo"
            />
          </div>

          <div>
            <Label htmlFor="start_date">Fecha de Inicio</Label>
            <Input
              id="start_date"
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="renewal_date">Fecha de Renovación</Label>
            <Input
              id="renewal_date"
              type="date"
              value={formData.renewal_date}
              onChange={(e) => setFormData({ ...formData, renewal_date: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="claims_phone">Teléfono de Siniestros</Label>
            <Input
              id="claims_phone"
              value={formData.claims_phone}
              onChange={(e) => setFormData({ ...formData, claims_phone: e.target.value })}
              placeholder="+34 XXX XXX XXX"
            />
          </div>

          <div>
            <Label htmlFor="customer_service_phone">Teléfono de Atención al Cliente</Label>
            <Input
              id="customer_service_phone"
              value={formData.customer_service_phone}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customer_service_phone: e.target.value,
                })
              }
              placeholder="+34 XXX XXX XXX"
            />
          </div>

          <div>
            <Label htmlFor="customer_service_email">Email de Atención al Cliente</Label>
            <Input
              id="customer_service_email"
              type="email"
              value={formData.customer_service_email}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  customer_service_email: e.target.value,
                })
              }
              placeholder="email@aseguradora.com"
            />
          </div>

          <div>
            <Label htmlFor="policy_document">Documento de la Póliza</Label>
            <div className="space-y-2">
              <Input
                id="policy_document"
                type="file"
                accept=".pdf"
                onChange={handleDocumentUpload}
                disabled={uploading}
              />
              {formData.policy_document_url && (
                <Button
                  variant="outline"
                  className="w-full bg-transparent"
                  onClick={() => window.open(formData.policy_document_url, "_blank")}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Ver Póliza
                </Button>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button className="flex-1" onClick={handleSave} disabled={saving || !formData.insurance_company}>
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
