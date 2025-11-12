"use client"

import { useEffect, useState } from "react"
import { MapPin, Navigation, List, ImageIcon, Home } from "lucide-react"
import { Card } from "@/components/ui/card"
import { createBrowserClient } from "@supabase/ssr"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import dynamic from "next/dynamic"

const BeachesMap = dynamic(() => import("@/components/beaches-map"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-100">
      <div className="text-gray-500">Cargando mapa...</div>
    </div>
  ),
})

interface DogBeach {
  id: string
  name: string
  municipality: string
  province: string
  latitude: number
  longitude: number
  description: string | null
  image_url: string | null
  nearby_accommodations_url: string | null
  more_info_url: string | null
  how_to_get: string | null
  rules: string | null
  services: string | null
  photos_urls: string[] | null
  details_fetched: boolean
}

export default function PlayasPage() {
  const [beaches, setBeaches] = useState<DogBeach[]>([])
  const [filteredBeaches, setFilteredBeaches] = useState<DogBeach[]>([])
  const [selectedBeach, setSelectedBeach] = useState<DogBeach | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"map" | "list">("map")
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  useEffect(() => {
    loadBeaches()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      setFilteredBeaches(
        beaches.filter(
          (beach) =>
            beach.name.toLowerCase().includes(query) ||
            beach.municipality?.toLowerCase().includes(query) ||
            beach.province?.toLowerCase().includes(query) ||
            beach.description?.toLowerCase().includes(query),
        ),
      )
    } else {
      setFilteredBeaches(beaches)
    }
  }, [searchQuery, beaches])

  const loadBeaches = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      )

      const { data, error } = await supabase.from("dog_beaches").select("*").order("name")

      if (error) throw error

      const processedData = (data || []).map((beach) => ({
        ...beach,
        image_url: beach.image_url ? beach.image_url.replace("-150x150", "") : null,
      }))

      setBeaches(processedData)
      setFilteredBeaches(processedData)
    } catch (error) {
      console.error("Error loading beaches:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleBeachSelect = async (beach: DogBeach) => {
    setSelectedBeach(beach)
    setCurrentPhotoIndex(0)

    if (!beach.details_fetched && beach.more_info_url) {
      setLoadingDetails(true)
      try {
        const response = await fetch(`/api/beaches/${beach.id}/fetch-details`, {
          method: "POST",
        })

        if (response.ok) {
          const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          )

          const { data: updatedBeach, error } = await supabase
            .from("dog_beaches")
            .select("*")
            .eq("id", beach.id)
            .single()

          if (!error && updatedBeach) {
            const processedBeach = {
              ...updatedBeach,
              image_url: updatedBeach.image_url ? updatedBeach.image_url.replace("-150x150", "") : null,
            }
            setSelectedBeach(processedBeach)
            setBeaches((prev) => prev.map((b) => (b.id === beach.id ? processedBeach : b)))
          }
        }
      } catch (error) {
        console.error("Error fetching beach details:", error)
      } finally {
        setLoadingDetails(false)
      }
    }
  }

  const openInGoogleMaps = (beach: DogBeach) => {
    const url = `https://www.google.com/maps/search/?api=1&query=${beach.latitude},${beach.longitude}`
    window.open(url, "_blank")
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando playas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      <div className="bg-white border-b p-3">
        <div className="flex gap-2">
          <Input
            type="text"
            placeholder="Buscar playas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
          <Button
            variant={viewMode === "map" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewMode(viewMode === "map" ? "list" : "map")}
            title={viewMode === "map" ? "Ver lista" : "Ver mapa"}
          >
            {viewMode === "map" ? <List className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          </Button>
        </div>
      </div>

      {viewMode === "map" ? (
        <div className="flex-1 relative overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>
          <BeachesMap beaches={filteredBeaches} onMarkerClick={handleBeachSelect} />
        </div>
      ) : (
        <div className="p-4 space-y-3 overflow-y-auto flex-1 pb-24">
          {filteredBeaches.map((beach) => (
            <Card
              key={beach.id}
              className="p-4 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => handleBeachSelect(beach)}
            >
              <div className="flex gap-3">
                {beach.image_url && (
                  <img
                    src={beach.image_url || "/placeholder.svg"}
                    alt={beach.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm line-clamp-2">{beach.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {beach.municipality}, {beach.province}
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {filteredBeaches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No se encontraron playas</p>
            </div>
          )}
        </div>
      )}

      <Sheet open={!!selectedBeach} onOpenChange={(open) => !open && setSelectedBeach(null)}>
        <SheetContent
          side="bottom"
          hideClose
          className="h-[75vh] overflow-y-auto p-0 rounded-t-3xl border-none"
          onInteractOutside={() => setSelectedBeach(null)}
        >
          {selectedBeach && (
            <div className="relative">
              <div className="relative h-40 w-full">
                <img
                  src={selectedBeach.image_url || "/placeholder.svg?height=160&width=400"}
                  alt={selectedBeach.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                  <h2 className="text-white text-xl font-bold drop-shadow-lg">{selectedBeach.name}</h2>

                  <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    <span>
                      {selectedBeach.municipality}, {selectedBeach.province}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => openInGoogleMaps(selectedBeach)}
                  className="absolute top-4 right-4 w-11 h-11 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors"
                  title="Ver en Google Maps"
                >
                  <Navigation className="w-5 h-5 text-primary" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {loadingDetails && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Obteniendo información detallada...</p>
                  </div>
                )}

                {selectedBeach.description && (
                  <div className="bg-primary/10 rounded-2xl p-4">
                    <p className="text-sm text-foreground leading-relaxed">{selectedBeach.description}</p>
                  </div>
                )}

                {selectedBeach.how_to_get && (
                  <div>
                    <h4 className="font-semibold mb-2 text-base">Cómo llegar</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedBeach.how_to_get}</p>
                  </div>
                )}

                {selectedBeach.photos_urls && selectedBeach.photos_urls.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 text-base flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Fotos de la playa
                    </h4>
                    <div className="relative">
                      <div className="overflow-hidden rounded-xl">
                        <div
                          className="flex transition-transform duration-300 ease-in-out"
                          style={{ transform: `translateX(-${currentPhotoIndex * 100}%)` }}
                        >
                          {selectedBeach.photos_urls.map((photo, index) => (
                            <img
                              key={index}
                              src={photo || "/placeholder.svg"}
                              alt={`${selectedBeach.name} - Foto ${index + 1}`}
                              className="w-full h-48 object-cover flex-shrink-0"
                            />
                          ))}
                        </div>
                      </div>

                      {selectedBeach.photos_urls.length > 1 && (
                        <>
                          <button
                            onClick={() =>
                              setCurrentPhotoIndex((prev) =>
                                prev === 0 ? selectedBeach.photos_urls!.length - 1 : prev - 1,
                              )
                            }
                            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                          >
                            ‹
                          </button>
                          <button
                            onClick={() =>
                              setCurrentPhotoIndex((prev) =>
                                prev === selectedBeach.photos_urls!.length - 1 ? 0 : prev + 1,
                              )
                            }
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/90 rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-colors"
                          >
                            ›
                          </button>

                          <div className="flex justify-center gap-1.5 mt-3">
                            {selectedBeach.photos_urls.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentPhotoIndex(index)}
                                className={`h-1.5 rounded-full transition-all ${
                                  index === currentPhotoIndex ? "w-6 bg-primary" : "w-1.5 bg-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {selectedBeach.rules && (
                  <div>
                    <h4 className="font-semibold mb-2 text-base">Normas de la playa</h4>
                    <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {selectedBeach.rules}
                    </div>
                  </div>
                )}

                {selectedBeach.services && (
                  <div>
                    <h4 className="font-semibold mb-2 text-base">Servicios</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{selectedBeach.services}</p>
                  </div>
                )}

                {selectedBeach.nearby_accommodations_url && (
                  <Button
                    onClick={() => window.open(selectedBeach.nearby_accommodations_url!, "_blank")}
                    className="w-full rounded-full py-6 text-sm font-medium"
                    variant="default"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Alojamientos pet friendly
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
