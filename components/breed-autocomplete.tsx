"use client"

import { useState, useEffect, useRef } from "react"
import { Tag, X } from "lucide-react"

interface BreedAutocompleteProps {
  value: string
  onChange: (value: string) => void
  species: string
  placeholder?: string
  className?: string
}

export function BreedAutocomplete({
  value,
  onChange,
  species,
  placeholder = "Buscar raza...",
  className = "",
}: BreedAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

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
    if (!species) {
      setResults([])
      return
    }

    console.log("[v0] Searching breeds for species:", species, "query:", query)

    const delayDebounce = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/breeds?species=${encodeURIComponent(species)}&query=${encodeURIComponent(query)}`,
        )
        const data = await response.json()
        console.log("[v0] Breed results:", data)
        setResults(data.breeds || [])
        setIsOpen((data.breeds || []).length > 0)
      } catch (error) {
        console.error("[v0] Error fetching breeds:", error)
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(delayDebounce)
  }, [query, species])

  useEffect(() => {
    if (isOpen && wrapperRef.current) {
      const rect = wrapperRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: rect.width,
      })
    }
  }, [isOpen])

  const handleSelect = (breed: string) => {
    setQuery(breed)
    onChange(breed)
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
        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#79747E]" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            console.log("[v0] Breed input changed:", e.target.value)
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => {
            if (species) setIsOpen(true)
          }}
          placeholder={placeholder}
          disabled={!species}
          className={`w-full pl-10 pr-10 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
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
            results.map((breed, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSelect(breed)}
                className="w-full px-4 py-3 text-left hover:bg-[#E8DEF8] transition-colors text-sm text-[#1C1B1F] border-b border-[#E8DEF8] last:border-0"
              >
                {breed}
              </button>
            ))
          ) : (
            <div className="p-4 text-center text-[#79747E] text-sm">No se encontraron razas</div>
          )}
        </div>
      )}
    </div>
  )
}
