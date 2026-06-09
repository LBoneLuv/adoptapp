"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { ArrowLeft, MapPin, Globe, Facebook, Instagram, Heart, Check } from "lucide-react"
import { PetCard } from "@/components/pet-card"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"

type Shelter = {
  id: string
  name: string
  location: string
  description: string
  profile_image_url: string | null
  cover_image_url: string | null
  website: string | null
  social_links: Array<{ platform: string; url: string }> | null
}

type Animal = {
  id: string
  name: string
  species: string
  breed: string
  age: string
  gender: string
  image_url: string
  images: string[]
}

const SocialIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "facebook":
      return <Facebook className="w-5 h-5" />
    case "instagram":
      return <Instagram className="w-5 h-5" />
    case "tiktok":
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
      )
    default:
      return null
  }
}

const DONATION_AMOUNTS = [5, 10, 20, 50]

export default function ProtectoraDetailPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const id = params?.id as string
  const [shelter, setShelter] = useState<Shelter | null>(null)
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [donateOpen, setDonateOpen] = useState(false)
  const [donationAmount, setDonationAmount] = useState<number>(10)
  const [customAmount, setCustomAmount] = useState("")
  const [donationMessage, setDonationMessage] = useState("")
  const [donating, setDonating] = useState(false)
  const [donatedOk, setDonatedOk] = useState(searchParams.get("donated") === "1")

  async function handleDonate() {
    const amount = customAmount ? Number.parseFloat(customAmount) : donationAmount
    if (!amount || amount <= 0) {
      alert("Introduce un importe válido")
      return
    }
    setDonating(true)
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shelterId: id, amount, message: donationMessage || null }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al donar")
      if (data.url) {
        window.location.href = data.url
      } else {
        setDonateOpen(false)
        setDonatedOk(true)
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error al procesar la donación")
      setDonating(false)
    }
  }

  useEffect(() => {
    if (!id) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const fetchData = async () => {
      const { data: shelterData } = await supabase.from("shelters").select("*").eq("id", id).single()

      if (shelterData) {
        setShelter(shelterData)

        const { data: animalsData } = await supabase
          .from("animals")
          .select("*")
          .eq("shelter_id", id)
          .eq("status", "available")
          .order("created_at", { ascending: false })

        setAnimals(animalsData || [])
      }

      setLoading(false)
    }

    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  if (!shelter) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <p className="text-lg text-muted-foreground mb-4">No se encontró la protectora</p>
        <Button onClick={() => router.back()}>Volver</Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 left-4 z-10 bg-background/80 backdrop-blur-sm"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>

        {shelter.cover_image_url && (
          <img
            src={shelter.cover_image_url || "/placeholder.svg"}
            alt={`${shelter.name} cover`}
            className="w-full h-48 object-cover"
          />
        )}
      </div>

      <div className="px-4 -mt-16 relative z-10">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {shelter.profile_image_url ? (
              <img
                src={shelter.profile_image_url || "/placeholder.svg"}
                alt={shelter.name}
                className="w-28 h-28 rounded-full border-4 border-background object-cover"
              />
            ) : (
              <div className="w-28 h-28 rounded-full border-4 border-background bg-muted flex items-center justify-center">
                <span className="text-4xl">🐾</span>
              </div>
            )}
          </div>

          {(shelter.website || (shelter.social_links && shelter.social_links.length > 0)) && (
            <div className="flex gap-2 mt-20">
              {shelter.website && (
                <a
                  href={shelter.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <Globe className="w-4 h-4 text-primary" />
                </a>
              )}
              {shelter.social_links?.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
                >
                  <div className="text-primary">
                    <SocialIcon platform={link.platform} />
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <h1 className="text-2xl font-bold">{shelter.name}</h1>
          <div className="flex items-center text-muted-foreground mt-1">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="text-sm">{shelter.location}</span>
          </div>
        </div>

        {/* Donación */}
        {donatedOk ? (
          <div className="mt-4 flex items-center gap-2 bg-[#E6F4EA] text-[#1E7E34] rounded-2xl px-4 py-3 text-sm font-medium">
            <Check className="w-5 h-5 flex-shrink-0" />
            ¡Gracias por tu donación! Tu aportación ayuda a {shelter.name}.
          </div>
        ) : (
          <Button
            onClick={() => setDonateOpen(true)}
            className="mt-4 w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold shadow-md"
          >
            <Heart className="w-5 h-5 mr-2 fill-white" />
            Donar a esta protectora
          </Button>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Sobre Nosotros</h2>
          <p className="text-muted-foreground">{shelter.description}</p>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-4">Nuestros Animales</h2>
          {animals.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {animals.map((animal) => (
                <PetCard key={animal.id} pet={animal} />
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No hay animales disponibles en este momento</p>
          )}
        </div>
      </div>

      {/* Sheet de donación */}
      <Sheet open={donateOpen} onOpenChange={setDonateOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Donar a {shelter.name}</SheetTitle>
            <SheetDescription>Elige un importe para apoyar su labor</SheetDescription>
          </SheetHeader>
          <div className="space-y-4 mt-4 px-1">
            <div className="grid grid-cols-4 gap-2">
              {DONATION_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  onClick={() => {
                    setDonationAmount(amt)
                    setCustomAmount("")
                  }}
                  className={`py-3 rounded-2xl font-semibold text-sm transition-colors ${
                    !customAmount && donationAmount === amt
                      ? "bg-[#6750A4] text-white"
                      : "bg-[#E8DEF8] text-[#6750A4]"
                  }`}
                >
                  {amt}€
                </button>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-[#49454F] mb-2">Otro importe (€)</label>
              <input
                type="number"
                min="1"
                step="1"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Ej: 25"
                className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#49454F] mb-2">Mensaje (opcional)</label>
              <textarea
                value={donationMessage}
                onChange={(e) => setDonationMessage(e.target.value)}
                rows={2}
                placeholder="Un mensaje de ánimo para la protectora"
                className="w-full px-4 py-3 bg-[#FFFBFE] border-2 border-[#79747E] rounded-2xl focus:border-[#6750A4] focus:outline-none text-[#1C1B1F] text-sm resize-none"
              />
            </div>
            <Button
              onClick={handleDonate}
              disabled={donating}
              className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 text-base font-semibold disabled:opacity-50"
            >
              <Heart className="w-5 h-5 mr-2 fill-white" />
              {donating ? "Procesando..." : `Donar ${customAmount || donationAmount}€`}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
