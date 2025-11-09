"use client"

import type React from "react"

import { Plus, Camera, X, Crosshair, MapPin } from "lucide-react"
import { useState, useEffect, useRef } from "react"
import { createBrowserClient } from "@/lib/supabase/client"
import LocationAutocomplete from "@/components/location-autocomplete"
import { put } from "@vercel/blob"
import dynamic from "next/dynamic"

const IncidentsMap = dynamic(() => import("@/components/incidents-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">Cargando mapa...</div>
    </div>
  ),
})

interface Incident {
  id: string
  title: string
  location: string
  description: string
  incident_type: string
  latitude: number
  longitude: number
  image_url: string | null
  created_at: string
  user_id: string
}

export default function AvisosPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [location, setLocation] = useState("")
  const [locationCoords, setLocationCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [description, setDescription] = useState("")
  const [incidentType, setIncidentType] = useState<"lost" | "found" | "abandoned">("lost")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const isDragging = useRef(false)

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    const supabase = createBrowserClient()
    const { data, error } = await supabase.from("incidents").select("*").order("created_at", { ascending: false })

    if (!error && data) {
      setIncidents(data)
    }
  }

  const handleGetCurrentLocation = () => {
    setIsLoadingLocation(true)
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lng = position.coords.longitude
          setLocationCoords({ lat, lng })

          try {
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=es`,
            )
            const data = await response.json()
            const locationName =
              data.address?.city || data.address?.town || data.address?.village || data.address?.municipality || ""
            setLocation(locationName)
          } catch (error) {
            console.error("Error getting location name:", error)
          }
          setIsLoadingLocation(false)
        },
        (error) => {
          console.error("Error getting location:", error)
          setIsLoadingLocation(false)
          showToast("No se pudo obtener tu ubicación", "error")
        },
      )
    } else {
      setIsLoadingLocation(false)
      showToast("Tu navegador no soporta geolocalización", "error")
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!title.trim() || !location.trim() || !description.trim()) {
      showToast("Por favor, completa todos los campos", "error")
      return
    }

    if (!locationCoords) {
      showToast("Por favor, selecciona una ubicación válida", "error")
      return
    }

    setIsLoading(true)

    try {
      const supabase = createBrowserClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        showToast("Debes iniciar sesión para reportar una incidencia", "error")
        setIsLoading(false)
        return
      }

      let imageUrl = null

      if (imageFile) {
        const blob = await put(`incidents/${Date.now()}-${imageFile.name}`, imageFile, {
          access: "public",
        })
        imageUrl = blob.url
      }

      const { error } = await supabase.from("incidents").insert({
        title,
        location,
        description,
        incident_type: incidentType,
        latitude: locationCoords.lat,
        longitude: locationCoords.lng,
        image_url: imageUrl,
        user_id: user.id,
        status: "active",
      })

      if (error) throw error

      showToast("Incidencia reportada con éxito", "success")
      setIsModalOpen(false)
      resetForm()
      fetchIncidents()
    } catch (error) {
      console.error("Error submitting incident:", error)
      showToast("Error al reportar la incidencia", "error")
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setTitle("")
    setLocation("")
    setLocationCoords(null)
    setDescription("")
    setIncidentType("lost")
    setImageFile(null)
    setImagePreview(null)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY
    isDragging.current = true
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const currentY = e.touches[0].clientY
    const diff = currentY - dragStartY.current

    if (diff > 0 && modalRef.current) {
      modalRef.current.style.transform = `translateY(${diff}px)`
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return
    const currentY = e.changedTouches[0].clientY
    const diff = currentY - dragStartY.current

    if (modalRef.current) {
      if (diff > 150) {
        setIsModalOpen(false)
      }
      modalRef.current.style.transform = ""
    }

    isDragging.current = false
  }

  const showToast = (message: string, type: "success" | "error") => {
    const toast = document.createElement("div")
    toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full text-white font-medium shadow-lg z-[10000] ${
      type === "success" ? "bg-green-600" : "bg-red-600"
    }`
    toast.textContent = message
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 3000)
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <div className="flex-1 relative overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
        <IncidentsMap incidents={incidents} onMarkerClick={(incident) => setSelectedIncident(incident)} />

        <button
          onClick={() => setIsModalOpen(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-[#6750A4] rounded-full shadow-lg flex items-center justify-center hover:bg-[#7965AF] transition-all hover:scale-110 active:scale-95 z-[1500]"
          aria-label="Reportar incidencia"
        >
          <Plus className="w-6 h-6 text-white" strokeWidth={3} />
        </button>
      </div>

      {selectedIncident && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[2050]" onClick={() => setSelectedIncident(null)} />
          <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-2xl z-[2100] p-4 max-w-sm mx-auto">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-semibold text-gray-900 text-base">{selectedIncident.title}</h3>
              <button onClick={() => setSelectedIncident(null)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">{selectedIncident.location}</p>
            </div>
            <p className="text-sm text-gray-700 mb-3">{selectedIncident.description}</p>
            {selectedIncident.image_url && (
              <img
                src={selectedIncident.image_url || "/placeholder.svg"}
                alt={selectedIncident.title}
                className="w-full h-48 object-cover rounded-xl"
              />
            )}
            <div className="mt-3">
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                  selectedIncident.incident_type === "lost"
                    ? "bg-red-100 text-red-700"
                    : selectedIncident.incident_type === "found"
                      ? "bg-purple-100 text-purple-700"
                      : "bg-orange-100 text-orange-700"
                }`}
              >
                {selectedIncident.incident_type === "lost"
                  ? "Perdido"
                  : selectedIncident.incident_type === "found"
                    ? "Encontrado"
                    : "Abandonado"}
              </span>
            </div>
          </div>
        </>
      )}

      {isModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-[2050]" onClick={() => setIsModalOpen(false)} />

          <div
            ref={modalRef}
            className="fixed inset-x-0 bottom-0 z-[2100] bg-[#FFFBFE] rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col transition-transform"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-[#79747E] rounded-full opacity-40" />
            </div>

            <div className="px-6 py-3 border-b border-[#E7E0EC] flex items-center justify-between">
              <h2 className="font-semibold text-[#1C1B1F] text-base">Reportar Incidencia</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full">
                <X className="w-5 h-5 text-[#49454F]" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-2">Tipo de incidencia</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setIncidentType("lost")}
                    className={`py-2.5 px-3 rounded-xl font-medium text-sm transition-colors ${
                      incidentType === "lost"
                        ? "bg-[#B3261E] text-white"
                        : "bg-[#F5F5F5] text-[#49454F] hover:bg-[#E8E8E8]"
                    }`}
                  >
                    Perdido
                  </button>
                  <button
                    onClick={() => setIncidentType("found")}
                    className={`py-2.5 px-3 rounded-xl font-medium text-sm transition-colors ${
                      incidentType === "found"
                        ? "bg-[#6750A4] text-white"
                        : "bg-[#F5F5F5] text-[#49454F] hover:bg-[#E8E8E8]"
                    }`}
                  >
                    Encontrado
                  </button>
                  <button
                    onClick={() => setIncidentType("abandoned")}
                    className={`py-2.5 px-3 rounded-xl font-medium text-sm transition-colors ${
                      incidentType === "abandoned"
                        ? "bg-[#FF9800] text-white"
                        : "bg-[#F5F5F5] text-[#49454F] hover:bg-[#E8E8E8]"
                    }`}
                  >
                    Abandonado
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="incident-title" className="block text-sm font-medium text-[#49454F] mb-1.5">
                  Título de la incidencia
                </label>
                <input
                  id="incident-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Perro encontrado en Malasaña"
                  className="w-full px-4 py-3 bg-transparent border border-[#79747E] rounded-xl text-[#1C1B1F] placeholder:text-[#79747E] focus:outline-none focus:border-[#6750A4] focus:border-2 transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#49454F] mb-1.5">Ubicación</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <LocationAutocomplete
                      value={location}
                      onChange={setLocation}
                      onSelect={(loc) => {
                        setLocation(loc.name)
                        setLocationCoords({ lat: loc.lat, lng: loc.lng })
                      }}
                      placeholder="Buscar ubicación..."
                    />
                  </div>
                  <button
                    onClick={handleGetCurrentLocation}
                    disabled={isLoadingLocation}
                    className="p-3 bg-[#6750A4] text-white rounded-xl hover:bg-[#7965AF] transition-colors disabled:opacity-50"
                    title="Usar mi ubicación"
                  >
                    <Crosshair className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="incident-description" className="block text-sm font-medium text-[#49454F] mb-1.5">
                  Descripción
                </label>
                <textarea
                  id="incident-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Proporciona más detalles sobre la incidencia..."
                  rows={4}
                  className="w-full px-4 py-3 bg-transparent border border-[#79747E] rounded-xl text-[#1C1B1F] placeholder:text-[#79747E] focus:outline-none focus:border-[#6750A4] focus:border-2 transition-colors resize-none text-sm"
                />
              </div>

              <div>
                <input
                  type="file"
                  id="incident-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <label
                  htmlFor="incident-image"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#E8DEF8] text-[#6750A4] rounded-full font-medium hover:bg-[#D0BCFF] transition-colors cursor-pointer text-sm"
                >
                  <Camera className="w-5 h-5" />
                  {imagePreview ? "Cambiar Foto" : "Añadir Foto"}
                </label>
                {imagePreview && (
                  <div className="mt-3 relative">
                    <img
                      src={imagePreview || "/placeholder.svg"}
                      alt="Preview"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                    <button
                      onClick={() => {
                        setImageFile(null)
                        setImagePreview(null)
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E7E0EC]">
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="w-full py-3.5 bg-[#6750A4] text-white rounded-full font-semibold hover:bg-[#7965AF] transition-colors shadow-md disabled:opacity-50 text-sm"
              >
                {isLoading ? "Enviando..." : "Enviar Reporte"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
