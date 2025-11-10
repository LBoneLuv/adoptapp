"use client"

import Link from "next/link"
import { Dog, MapPin, Stethoscope, HomeIcon, GraduationCap } from "lucide-react"

export default function ServiciosPage() {
  const services = [
    {
      title: "Playas perrunas",
      description: "Encuentra playas pet-friendly",
      icon: MapPin,
      href: "/servicios/playas",
      color: "bg-gradient-to-br from-cyan-500 to-blue-600",
    },
    {
      title: "Veterinarios",
      description: "Encuentra veterinarios cerca",
      icon: Stethoscope,
      href: "/servicios/veterinarios",
      color: "bg-gradient-to-br from-emerald-500 to-teal-600",
    },
    {
      title: "Adiestradores",
      description: "Entrena a tu mascota",
      icon: GraduationCap,
      href: "/servicios/adiestradores",
      color: "bg-gradient-to-br from-amber-500 to-orange-600",
    },
    {
      title: "Paseadores",
      description: "Paseos profesionales",
      icon: Dog,
      href: "/servicios/paseadores",
      color: "bg-gradient-to-br from-rose-500 to-pink-600",
    },
    {
      title: "Residencias",
      description: "Alojamiento para tu mascota",
      icon: HomeIcon,
      href: "/servicios/residencias",
      color: "bg-gradient-to-br from-violet-500 to-purple-600",
    },
  ]

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#6750A4] to-[#8B7BC8] px-6 py-8 text-white">
        <h1 className="font-bold mb-2 text-xl">Servicios</h1>
        <p className="text-white/90 text-xs">Todo lo que necesitas para tu mascota</p>
      </div>

      {/* Services Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="grid grid-cols-2 gap-4">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <Link
                key={service.href}
                href={service.href}
                className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                <div className={`${service.color} p-6 h-48 flex flex-col justify-between`}>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl w-12 h-12 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1 leading-tight">{service.title}</h3>
                    <p className="text-white/90 text-xs leading-tight">{service.description}</p>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
