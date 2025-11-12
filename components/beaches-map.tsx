"use client"

import { useEffect, useRef, useState } from "react"

interface Beach {
  id: string
  name: string
  municipality: string
  province: string
  latitude: number
  longitude: number
  description: string | null
  image_url: string | null
  restrictions: string | null
  more_info_url: string | null
}

interface BeachesMapProps {
  beaches: Beach[]
  onMarkerClick?: (beach: Beach) => void
}

export default function BeachesMap({ beaches, onMarkerClick }: BeachesMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [map, setMap] = useState<any>(null)
  const [markers, setMarkers] = useState<any[]>([])

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return

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
    if (!map || beaches.length === 0) return

    const loadMarkers = async () => {
      const L = (await import("leaflet")).default

      // Clear existing markers
      markers.forEach((marker) => marker.remove())

      const createBeachIcon = () => {
        const iconHtml = `
          <div style="
            width: 32px;
            height: 32px;
            background-color: #6750A4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
          ">🏖️</div>
        `
        return L.divIcon({
          html: iconHtml,
          className: "",
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        })
      }

      const newMarkers = beaches.map((beach) => {
        const marker = L.marker([beach.latitude, beach.longitude], {
          icon: createBeachIcon(),
        }).addTo(map)

        marker.on("click", () => {
          if (onMarkerClick) {
            onMarkerClick(beach)
          }
        })

        return marker
      })

      setMarkers(newMarkers)

      if (beaches.length > 0) {
        const bounds = L.latLngBounds(beaches.map((beach) => [beach.latitude, beach.longitude]))
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 })
      }
    }

    loadMarkers()
  }, [map, beaches])

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="w-full h-full" />
    </>
  )
}
