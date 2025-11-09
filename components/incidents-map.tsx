"use client"

import { useEffect, useRef, useState } from "react"

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
}

interface IncidentsMapProps {
  incidents: Incident[]
  onMarkerClick?: (incident: Incident) => void
}

export default function IncidentsMap({ incidents, onMarkerClick }: IncidentsMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

    // Load Leaflet dynamically
    const loadMap = async () => {
      const L = (await import("leaflet")).default

      // Fix for default marker icon
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      const mapInstance = L.map(mapRef.current!).setView([40.4168, -3.7038], 6)

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapInstance)

      setMap(mapInstance)
    }

    loadMap()

    return () => {
      if (map) {
        map.remove()
      }
    }
  }, [])

  useEffect(() => {
    if (!map || incidents.length === 0) return

    const loadMarkers = async () => {
      const L = (await import("leaflet")).default

      // Clear existing markers
      markers.forEach((marker) => marker.remove())

      const createCustomIcon = (type: string) => {
        const color = type === "lost" ? "#ef4444" : type === "found" ? "#a855f7" : "#f97316"
        const iconHtml = `
          <div style="
            width: 32px;
            height: 32px;
            background-color: ${color};
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            cursor: pointer;
          "></div>
        `
        return L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
      }

      const newMarkers = incidents.map((incident) => {
        // Disable tooltip
        const marker = L.marker([incident.latitude, incident.longitude], {
          icon: createCustomIcon(incident.incident_type),
          title: undefined,
        }).addTo(map)

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="font-weight: bold; margin-bottom: 8px;">${incident.title}</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 4px;">📍 ${incident.location}</p>
            <p style="color: #333; font-size: 13px; margin-bottom: 8px;">${incident.description}</p>
            <span style="
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 500;
              background-color: ${incident.incident_type === "lost" ? "#fee2e2" : incident.incident_type === "found" ? "#f3e8ff" : "#ffedd5"};
              color: ${incident.incident_type === "lost" ? "#991b1b" : incident.incident_type === "found" ? "#6b21a8" : "#9a3412"};
            ">
              ${incident.incident_type === "lost" ? "Perdido" : incident.incident_type === "found" ? "Encontrado" : "Abandonado"}
            </span>
          </div>
        `
        marker.bindPopup(popupContent)

        marker.on("click", () => {
          if (onMarkerClick) {
            onMarkerClick(incident)
          }
        })

        return marker
      })

      setMarkers(newMarkers)

      if (incidents.length > 0) {
        const bounds = L.latLngBounds(incidents.map((inc) => [inc.latitude, inc.longitude]))
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      }
    }

    loadMarkers()
  }, [map, incidents])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      <div ref={mapRef} className="w-full h-full" />

      <div className="absolute bottom-24 left-4 bg-white rounded-xl shadow-lg p-3 z-[1001]">
        <h3 className="font-semibold text-xs text-gray-700 mb-2">Leyenda</h3>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-xs text-gray-600">Perdido</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-xs text-gray-600">Encontrado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500" />
            <span className="text-xs text-gray-600">Abandonado</span>
          </div>
        </div>
      </div>
    </>
  )
}
