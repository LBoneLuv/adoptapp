"use client"

import Link from "next/link"
import { Heart, Home, MapPin, Users, PawPrint } from "lucide-react"

export default function PrincipalPage() {
  const services = [
    {
      title: "Adoptar animales",
      description: "Encuentra tu nuevo mejor amigo",
      icon: PawPrint,
      href: "/adopta",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
    },
    {
      title: "Protectoras",
      description: "Conoce las protectoras cerca de ti",
      icon: Home,
      href: "/protectoras",
      color: "bg-gradient-to-br from-pink-500 to-pink-600",
    },
    {
      title: "Animales perdidos",
      description: "Ayuda a reunir familias",
      icon: MapPin,
      href: "/avisos",
      color: "bg-gradient-to-br from-orange-500 to-orange-600",
    },
    {
      title: "Comunidad",
      description: "Conecta con otros amantes de animales",
      icon: Users,
      href: "/comunidad",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
    },
    {
      title: "Mis animales",
      description: "Gestiona tus mascotas",
      icon: Heart,
      href: "/mis-animales",
      color: "bg-gradient-to-br from-green-500 to-green-600",
    },
  ]

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#6750A4] to-[#8B7BC8] px-6 py-8 text-white">
        <h1 className="font-bold mb-2 text-xl">Bienvenido a Arko</h1>
        <p className="text-white/90 text-xs">Tu compañero en el cuidado de animales</p>
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
                    <h3 className="text-white font-bold mb-1 leading-tight text-lg">{service.title}</h3>
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
