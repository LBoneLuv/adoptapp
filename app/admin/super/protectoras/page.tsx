import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Home } from "lucide-react"

async function checkSuperAdmin() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user is super admin in profiles or shelters
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  const { data: shelter } = await supabase.from("shelters").select("role").eq("id", user.id).single()

  const isSuperAdmin = profile?.role === "super_admin" || shelter?.role === "super_admin"

  if (!isSuperAdmin) {
    redirect("/adopta")
  }

  return supabase
}

async function getPendingShelters() {
  const supabase = await checkSuperAdmin()

  const { data, error } = await supabase
    .from("shelters")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error loading pending shelters:", error)
    return []
  }

  return data || []
}

async function approveShelter(shelterId: string) {
  "use server"
  const supabase = await checkSuperAdmin()

  const { error } = await supabase
    .from("shelters")
    .update({ status: "approved", updated_at: new Date().toISOString() })
    .eq("id", shelterId)

  if (error) {
    console.error("[v0] Error approving shelter:", error)
    throw new Error("Error al aprobar la protectora")
  }

  redirect("/admin/super/protectoras")
}

async function rejectShelter(shelterId: string) {
  "use server"
  const supabase = await checkSuperAdmin()

  const { error } = await supabase
    .from("shelters")
    .update({ status: "rejected", updated_at: new Date().toISOString() })
    .eq("id", shelterId)

  if (error) {
    console.error("[v0] Error rejecting shelter:", error)
    throw new Error("Error al rechazar la protectora")
  }

  redirect("/admin/super/protectoras")
}

export default async function SuperAdminProtectorasPage() {
  const shelters = await getPendingShelters()

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-amber-600">Panel Super Admin</h1>
          <Link href="/adopta">
            <Button variant="ghost" size="icon">
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Protectoras Pendientes</h2>
          <p className="text-gray-600">Revisa y aprueba las protectoras que se han registrado</p>
        </div>

        {shelters.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-500">No hay protectoras pendientes de aprobación</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {shelters.map((shelter) => (
              <Card key={shelter.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle>{shelter.name}</CardTitle>
                      <CardDescription>{shelter.email}</CardDescription>
                    </div>
                    <Badge variant="secondary">Pendiente</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Ubicación</p>
                      <p className="text-sm text-gray-600">{shelter.location || "No especificada"}</p>
                    </div>

                    {shelter.phone && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Teléfono</p>
                        <p className="text-sm text-gray-600">{shelter.phone}</p>
                      </div>
                    )}

                    {shelter.description && (
                      <div>
                        <p className="text-sm font-medium text-gray-700">Descripción</p>
                        <p className="text-sm text-gray-600">{shelter.description}</p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <form action={approveShelter.bind(null, shelter.id)} className="flex-1">
                        <Button type="submit" className="w-full bg-green-600 hover:bg-green-700">
                          Aprobar
                        </Button>
                      </form>
                      <form action={rejectShelter.bind(null, shelter.id)} className="flex-1">
                        <Button type="submit" variant="destructive" className="w-full">
                          Rechazar
                        </Button>
                      </form>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
