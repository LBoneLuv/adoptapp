"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ShelterCard } from "@/components/shelter-card"
import { LocationAutocomplete } from "@/components/location-autocomplete"
import { X } from "lucide-react"
import useSWR from "swr"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function ProtectorasPage() {
  const [locationFilter, setLocationFilter] = useState("")
  const [openSheet, setOpenSheet] = useState(false)

  const { data: shelters, isLoading } = useSWR("/api/shelters", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000,
    refreshInterval: 300000,
    keepPreviousData: true,
  })

  const filteredShelters =
    shelters?.filter((shelter: any) => {
      if (!locationFilter) return true
      return shelter.location?.toLowerCase().includes(locationFilter.toLowerCase())
    }) || []

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      {/* Location Filter */}
      <div className="px-4 bg-[#FFFBFE] shadow-sm py-4">
        <Button
          variant="outline"
          onClick={() => setOpenSheet(true)}
          className={`w-full bg-[#FFFBFE] border-[#79747E] text-[#1C1B1F] hover:bg-[#E8DEF8] hover:text-[#1C1B1F] rounded-full h-12 justify-start ${
            locationFilter ? "bg-[#E8DEF8] border-[#6750A4]" : ""
          }`}
        >
          <span className="font-medium">{locationFilter || "Todas las ubicaciones"}</span>
        </Button>

        {locationFilter && (
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center gap-1 bg-[#E8DEF8] text-[#6750A4] px-3 py-1 rounded-full text-xs font-medium">
              {locationFilter}
              <button onClick={() => setLocationFilter("")} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shelter Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-32 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredShelters && filteredShelters.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-[#49454F] text-lg">
              {locationFilter ? "No hay protectoras en esta ubicación" : "No hay protectoras disponibles"}
            </p>
            <p className="text-[#79747E] text-sm mt-2">
              {locationFilter
                ? "Intenta buscar en otra ubicación"
                : "Las protectoras aparecerán aquí una vez sean aprobadas"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredShelters?.map((shelter: any) => (
              <ShelterCard key={shelter.id} shelter={shelter} />
            ))}
          </div>
        )}
      </div>

      {/* Location Filter Sheet - Added overflow-visible and min-height for dropdown visibility */}
      <Sheet open={openSheet} onOpenChange={setOpenSheet}>
        <SheetContent side="bottom" className="rounded-t-3xl overflow-visible min-h-[400px]">
          <SheetHeader>
            <SheetTitle>Filtrar por Ubicación</SheetTitle>
            <SheetDescription>Busca protectoras por ciudad o pueblo</SheetDescription>
          </SheetHeader>
          <div className="mt-0 pb-0 pl-5 pr-5">
            <LocationAutocomplete
              value={locationFilter}
              onChange={(location) => {
                setLocationFilter(location)
                setTimeout(() => setOpenSheet(false), 300)
              }}
              placeholder="Buscar ubicación..."
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
