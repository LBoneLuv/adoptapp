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
      image: "/images/adoptar.jpg",
    },
    {
      title: "Protectoras",
      description: "Conoce las protectoras cerca de ti",
      icon: Home,
      href: "/protectoras",
      image: "/images/protectoras.jpg",
    },
    {
      title: "Animales perdidos",
      description: "Ayuda a reunir familias",
      icon: MapPin,
      href: "/avisos",
      image: "/images/animales-perdidos.jpg",
    },
    {
      title: "Comunidad",
      description: "Conecta con otros amantes de animales",
      icon: Users,
      href: "/comunidad",
      image: "/images/comunidad.jpg",
    },
  ]

  const misAnimalesCard = {
    title: "Mis animales",
    description: "Gestiona tus mascotas",
    icon: Heart,
    href: "/mis-animales",
    image: "/images/mis-animales.jpg",
  }

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      {/* Services Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-4">
          <Link
            href={misAnimalesCard.href}
            className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] block"
          >
            <div
              className="relative p-6 flex flex-col justify-between h-44 bg-cover bg-center"
              style={{ backgroundImage: `url(${misAnimalesCard.image})` }}
            >
              <div className="absolute inset-0 bg-black/50"></div>

              <div className="relative z-10">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl w-12 h-12 flex items-center justify-center mb-auto">
                  <misAnimalesCard.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-white font-bold mb-1 leading-tight text-sm">{misAnimalesCard.title}</h3>
                <p className="text-white/90 text-xs leading-tight">{misAnimalesCard.description}</p>
              </div>
            </div>
          </Link>

          <div className="grid grid-cols-2 gap-4">
            {services.map((service) => {
              const Icon = service.icon
              return (
                <Link
                  key={service.href}
                  href={service.href}
                  className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <div
                    className="relative p-6 flex flex-col justify-between h-44 bg-cover bg-center"
                    style={{ backgroundImage: `url(${service.image})` }}
                  >
                    <div className="absolute inset-0 bg-black/50"></div>

                    <div className="relative z-10">
                      <div className="bg-white/20 backdrop-blur-sm rounded-2xl w-12 h-12 flex items-center justify-center mb-auto">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>

                    <div className="relative z-10">
                      <h3 className="text-white font-bold mb-1 leading-tight text-sm">{service.title}</h3>
                      <p className="text-white/90 text-xs leading-tight">{service.description}</p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
