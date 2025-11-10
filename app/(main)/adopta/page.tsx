"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { PetCard } from "@/components/pet-card"
import { LocationAutocomplete } from "@/components/location-autocomplete"
import { BreedAutocomplete } from "@/components/breed-autocomplete"
import { X } from "lucide-react"
import useSWR from "swr"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdoptappHome() {
  const [filters, setFilters] = useState({
    species: "",
    breed: "",
    location: "",
  })

  const [openSheet, setOpenSheet] = useState<"type" | "breed" | "location" | null>(null)

  const { data: animals, isLoading } = useSWR("/api/animals", fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 300000,
    refreshInterval: 300000,
    keepPreviousData: true,
  })

  const filteredAnimals =
    animals?.filter((animal: any) => {
      if (filters.species && animal.species !== filters.species) return false
      if (filters.breed && animal.breed?.toLowerCase() !== filters.breed.toLowerCase()) return false
      if (filters.location && !animal.location?.toLowerCase().includes(filters.location.toLowerCase())) return false
      return true
    }) || []

  const handleClearFilter = (filterKey: keyof typeof filters) => {
    setFilters({ ...filters, [filterKey]: "" })
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      {/* Search and Filters */}
      <div className="px-4 bg-[#FFFBFE] shadow-sm py-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setOpenSheet("type")}
            className={`flex-1 bg-[#FFFBFE] border-[#79747E] text-[#1C1B1F] hover:bg-[#E8DEF8] hover:text-[#1C1B1F] rounded-full leading-7 h-9 ${
              filters.species ? "bg-[#E8DEF8] border-[#6750A4]" : ""
            }`}
          >
            <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="8.5" cy="5" rx="2.5" ry="3" />
              <ellipse cx="15.5" cy="5" rx="2.5" ry="3" />
              <ellipse cx="5" cy="10" rx="2" ry="2.5" />
              <ellipse cx="19" cy="10" rx="2" ry="2.5" />
              <path d="M12 10c-2.5 0-4.5 1.5-5 4-.3 1.5.5 3 2 3.5 1 .3 2 .5 3 .5s2-.2 3-.5c1.5-.5 2.3-2 2-3.5-.5-2.5-2.5-4-5-4z" />
            </svg>
            {filters.species
              ? filters.species === "perro"
                ? "Perro"
                : filters.species === "gato"
                  ? "Gato"
                  : "Otro"
              : "Tipo"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpenSheet("breed")}
            className={`flex-1 bg-[#FFFBFE] border-[#79747E] text-[#1C1B1F] hover:bg-[#E8DEF8] hover:text-[#1C1B1F] rounded-full h-9 ${
              filters.breed ? "bg-[#E8DEF8] border-[#6750A4]" : ""
            }`}
          >
            {filters.breed || "Raza"}
          </Button>
          <Button
            variant="outline"
            onClick={() => setOpenSheet("location")}
            className={`flex-1 bg-[#FFFBFE] border-[#79747E] text-[#1C1B1F] hover:bg-[#E8DEF8] hover:text-[#1C1B1F] rounded-full h-9 ${
              filters.location ? "bg-[#E8DEF8] border-[#6750A4]" : ""
            }`}
          >
            {filters.location || "Ubicación"}
          </Button>
        </div>

        {/* Active Filters */}
        {(filters.species || filters.breed || filters.location) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {filters.species && (
              <div className="flex items-center gap-1 bg-[#E8DEF8] text-[#6750A4] px-3 py-1 rounded-full text-xs font-medium">
                {filters.species === "perro" ? "Perro" : filters.species === "gato" ? "Gato" : "Otro"}
                <button onClick={() => handleClearFilter("species")} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {filters.breed && (
              <div className="flex items-center gap-1 bg-[#E8DEF8] text-[#6750A4] px-3 py-1 rounded-full text-xs font-medium">
                {filters.breed}
                <button onClick={() => handleClearFilter("breed")} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {filters.location && (
              <div className="flex items-center gap-1 bg-[#E8DEF8] text-[#6750A4] px-3 py-1 rounded-full text-xs font-medium">
                {filters.location}
                <button onClick={() => handleClearFilter("location")} className="ml-1">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pet Listing */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden animate-pulse">
                <div className="w-full h-40 bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {filteredAnimals && filteredAnimals.length > 0 ? (
              filteredAnimals.map((animal: any) => <PetCard key={animal.id} pet={animal} />)
            ) : (
              <div className="col-span-1 text-center py-8 text-[#49454F]">
                <p>No hay animales que coincidan con los filtros</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Type Filter Sheet */}
      <Sheet open={openSheet === "type"} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl">
          <SheetHeader>
            <SheetTitle>Seleccionar Tipo de Animal</SheetTitle>
            <SheetDescription>Elige el tipo de animal que quieres adoptar</SheetDescription>
          </SheetHeader>
          <div className="space-y-3 pl-5 pr-5 mb-7 mt-[0]">
            {["perro", "gato", "otro"].map((type) => (
              <button
                key={type}
                onClick={() => {
                  setFilters({ ...filters, species: type, breed: "" })
                  setOpenSheet(null)
                }}
                className={`w-full p-4 text-left rounded-2xl border-2 transition-colors ${
                  filters.species === type
                    ? "border-[#6750A4] bg-[#E8DEF8] text-[#6750A4]"
                    : "border-[#79747E] bg-white text-[#1C1B1F] hover:bg-[#E8DEF8]"
                }`}
              >
                {type === "perro" ? "Perro" : type === "gato" ? "Gato" : "Otro"}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Breed Filter Sheet */}
      <Sheet open={openSheet === "breed"} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl overflow-visible min-h-[400px]">
          <SheetHeader>
            <SheetTitle>Seleccionar Raza</SheetTitle>
            <SheetDescription>
              {filters.species ? "Busca la raza del animal" : "Primero selecciona un tipo de animal"}
            </SheetDescription>
          </SheetHeader>
          <div className="pl-5 pr-5 mt-0 pb-0">
            <BreedAutocomplete
              value={filters.breed}
              onChange={(breed) => {
                setFilters({ ...filters, breed })
                setTimeout(() => setOpenSheet(null), 300)
              }}
              species={filters.species}
              placeholder={filters.species ? "Buscar raza..." : "Selecciona un tipo primero"}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Location Filter Sheet */}
      <Sheet open={openSheet === "location"} onOpenChange={(open) => !open && setOpenSheet(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl overflow-visible min-h-[400px]">
          <SheetHeader>
            <SheetTitle>Seleccionar Ubicación</SheetTitle>
            <SheetDescription>Busca por ciudad o pueblo</SheetDescription>
          </SheetHeader>
          <div className="mt-0 pb-0 pl-5 pr-5">
            <LocationAutocomplete
              value={filters.location}
              onChange={(location) => {
                setFilters({ ...filters, location })
                setTimeout(() => setOpenSheet(null), 300)
              }}
              placeholder="Buscar ubicación..."
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
