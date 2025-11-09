import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ArrowLeft, Check, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Image from "next/image"

async function approveShelter(shelterId: string) {
  "use server"
  const supabase = await createClient()
  await supabase.from("shelters").update({ status: "approved" }).eq("id", shelterId)
}

async function rejectShelter(shelterId: string) {
  "use server"
  const supabase = await createClient()
  await supabase.from("shelters").update({ status: "rejected" }).eq("id", shelterId)
}

export default async function AdminProtectorasPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Get all shelters
  const { data: shelters } = await supabase.from("shelters").select("*").order("created_at", { ascending: false })

  const pendingShelters = shelters?.filter((s) => s.status === "pending") || []
  const approvedShelters = shelters?.filter((s) => s.status === "approved") || []
  const rejectedShelters = shelters?.filter((s) => s.status === "rejected") || []

  return (
    <div className="flex flex-col min-h-screen bg-[#FEF7FF]">
      {/* Header */}
      <header className="px-4 py-4 bg-[#FFFBFE] shadow-sm flex items-center gap-3">
        <Link
          href="/admin/animales"
          className="w-10 h-10 bg-[#E8DEF8] rounded-full flex items-center justify-center hover:bg-[#D0BCFF] transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-[#6750A4]" />
        </Link>
        <h1 className="font-bold text-[#1C1B1F] text-base">Gestión de Protectoras</h1>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Pending Shelters */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1C1B1F] mb-4">Pendientes de Aprobación ({pendingShelters.length})</h2>
          {pendingShelters.length === 0 ? (
            <p className="text-[#49454F] text-sm">No hay protectoras pendientes de aprobación</p>
          ) : (
            <div className="space-y-4">
              {pendingShelters.map((shelter) => (
                <Card key={shelter.id} className="p-4 bg-[#FFFBFE] border-0 shadow-md rounded-3xl">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#E7E0EC] flex-shrink-0">
                      <Image
                        src={shelter.profile_image_url || "/placeholder.svg?height=64&width=64"}
                        alt={shelter.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1C1B1F] mb-1">{shelter.name}</h3>
                      <p className="text-sm text-[#49454F] mb-1">{shelter.location}</p>
                      <p className="text-sm text-[#49454F]">{shelter.email}</p>
                      <p className="text-sm text-[#49454F]">{shelter.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <form action={approveShelter.bind(null, shelter.id)} className="flex-1">
                      <Button
                        type="submit"
                        className="w-full bg-[#006C4C] hover:bg-[#005A3F] text-white rounded-full text-sm font-semibold h-10"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Aprobar
                      </Button>
                    </form>
                    <form action={rejectShelter.bind(null, shelter.id)} className="flex-1">
                      <Button
                        type="submit"
                        variant="outline"
                        className="w-full border-2 border-[#BA1A1A] text-[#BA1A1A] hover:bg-[#BA1A1A] hover:text-white rounded-full text-sm font-semibold h-10 bg-transparent"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Rechazar
                      </Button>
                    </form>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Approved Shelters */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-[#1C1B1F] mb-4">Aprobadas ({approvedShelters.length})</h2>
          {approvedShelters.length === 0 ? (
            <p className="text-[#49454F] text-sm">No hay protectoras aprobadas</p>
          ) : (
            <div className="space-y-4">
              {approvedShelters.map((shelter) => (
                <Card key={shelter.id} className="p-4 bg-[#FFFBFE] border-0 shadow-md rounded-3xl">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#E7E0EC] flex-shrink-0">
                      <Image
                        src={shelter.profile_image_url || "/placeholder.svg?height=64&width=64"}
                        alt={shelter.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1C1B1F] mb-1">{shelter.name}</h3>
                      <p className="text-sm text-[#49454F] mb-1">{shelter.location}</p>
                      <p className="text-sm text-[#49454F]">{shelter.email}</p>
                    </div>
                    <div className="bg-[#D0F4EA] text-[#006C4C] px-3 py-1 rounded-full text-xs font-semibold">
                      Aprobada
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Rejected Shelters */}
        {rejectedShelters.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-[#1C1B1F] mb-4">Rechazadas ({rejectedShelters.length})</h2>
            <div className="space-y-4">
              {rejectedShelters.map((shelter) => (
                <Card key={shelter.id} className="p-4 bg-[#FFFBFE] border-0 shadow-md rounded-3xl opacity-60">
                  <div className="flex items-start gap-4">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden bg-[#E7E0EC] flex-shrink-0">
                      <Image
                        src={shelter.profile_image_url || "/placeholder.svg?height=64&width=64"}
                        alt={shelter.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-[#1C1B1F] mb-1">{shelter.name}</h3>
                      <p className="text-sm text-[#49454F] mb-1">{shelter.location}</p>
                      <p className="text-sm text-[#49454F]">{shelter.email}</p>
                    </div>
                    <div className="bg-[#F2B8B5] text-[#BA1A1A] px-3 py-1 rounded-full text-xs font-semibold">
                      Rechazada
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
