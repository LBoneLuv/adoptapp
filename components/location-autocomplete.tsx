"use client"

import { useState, useEffect, useRef } from "react"
import { MapPin, X } from "lucide-react"

interface LocationResult {
  place_id: number
  display_name: string
  name: string
  lat: string
  lon: string
  address: {
    city?: string
    town?: string
    village?: string
    municipality?: string
  }
}

interface LocationAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect?: (location: { name: string; lat: number; lng: number }) => void
  placeholder?: string
  className?: string
}

export function LocationAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Buscar ubicación...",
  className = "",
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<LocationResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    console.log("[v0] Searching locations for:", query)

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?` +
            `format=json&q=${encodeURIComponent(query)}&` +
            `addressdetails=1&countrycodes=es&limit=5&` +
            `featuretype=city,town,village`,
          {
            headers: {
              "User-Agent": "AdoptApp/1.0",
            },
          },
        )
        const data = await response.json()
        console.log("[v0] Location results:", data)

        const filtered = data.filter(
          (item: any) =>
            item.address?.city || item.address?.town || item.address?.village || item.address?.municipality,
        )

        console.log("[v0] Filtered locations:", filtered)
        setResults(filtered)
        setIsOpen(filtered.length > 0)
      } catch (error) {
        console.error("[v0] Error fetching locations:", error)
      } finally {
        setIsLoading(false)
      }
    }, 500)

    return () => clearTimeout(delayDebounce)
  }, [query])

  const handleSelect = (result: LocationResult) => {
    const locationName =
      result.address?.city ||
      result.address?.town ||
      result.address?.village ||
      result.address?.municipality ||
      result.name
    setQuery(locationName)
    onChange(locationName)

    if (onSelect) {
      onSelect({
        name: locationName,
        lat: Number.parseFloat(result.lat),
        lng: Number.parseFloat(result.lon),
      })
    }

    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery("")
    onChange("")
    setResults([])
  }

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#79747E]" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            console.log("[v0] Location input changed:", e.target.value)
            setQuery(e.target.value)
            if (e.target.value.length >= 2) setIsOpen(true)
          }}
          placeholder={placeholder}
          className={`w-full pl-10 pr-10 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm ${className}`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#79747E] hover:text-[#1C1B1F]"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[#79747E] rounded-2xl shadow-lg max-h-60 overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-4 text-center text-[#79747E] text-sm">Buscando...</div>
          ) : results.length > 0 ? (
            results.map((result) => {
              const locationName =
                result.address?.city ||
                result.address?.town ||
                result.address?.village ||
                result.address?.municipality ||
                result.name
              return (
                <button
                  key={result.place_id}
                  type="button"
                  onClick={() => handleSelect(result)}
                  className="w-full px-4 py-3 text-left hover:bg-[#E8DEF8] transition-colors text-sm text-[#1C1B1F] border-b border-[#E8DEF8] last:border-0"
                >
                  <div className="font-medium">{locationName}</div>
                  <div className="text-xs text-[#79747E] truncate">{result.display_name}</div>
                </button>
              )
            })
          ) : (
            <div className="p-4 text-center text-[#79747E] text-sm">No se encontraron ubicaciones</div>
          )}
        </div>
      )}
    </div>
  )
}

export default LocationAutocomplete
