"use client"

import Link from "next/link"
import { Dog, MapPin, Stethoscope, HomeIcon, GraduationCap } from "lucide-react"

export default function ServiciosPage() {
  const veterinariosCard = {
    title: "Veterinarios",
    description: "Encuentra veterinarios cerca",
    icon: Stethoscope,
    href: "/servicios/veterinarios",
    image: "/images/veterinarios.jpg",
  }

  const services = [
    {
      title: "Playas perrunas",
      description: "Encuentra playas pet-friendly",
      icon: MapPin,
      href: "/servicios/playas",
      image: "/images/playas-perrunas.jpg",
    },
    {
      title: "Adiestradores",
      description: "Entrena a tu mascota",
      icon: GraduationCap,
      href: "/servicios/adiestradores",
      image: "/images/adiestradores.jpg",
    },
    {
      title: "Paseadores",
      description: "Paseos profesionales",
      icon: Dog,
      href: "/servicios/paseadores",
      image: "/images/paseadores.jpg",
    },
    {
      title: "Residencias",
      description: "Alojamiento para tu mascota",
      icon: HomeIcon,
      href: "/servicios/residencias",
      image: "/images/residencias.jpg",
    },
  ]

  return (
    <div className="flex flex-col h-full bg-[#FEF7FF]">
      {/* Services Grid */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
        <div className="space-y-4">
          <Link
            href={veterinariosCard.href}
            className="group relative overflow-hidden rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] block"
          >
            <div
              className="relative p-6 flex flex-col justify-between h-44 bg-cover bg-center"
              style={{ backgroundImage: `url(${veterinariosCard.image})` }}
            >
              <div className="absolute inset-0 bg-black/50"></div>

              <div className="relative z-10">
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl w-12 h-12 flex items-center justify-center mb-auto">
                  <veterinariosCard.icon className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="relative z-10">
                <h3 className="text-white font-bold mb-1 leading-tight text-sm">{veterinariosCard.title}</h3>
                <p className="text-white/90 text-xs leading-tight">{veterinariosCard.description}</p>
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
