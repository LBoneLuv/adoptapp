import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CheckEmailPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FEF7FF] px-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-[#E8DEF8] rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-[#6750A4]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1C1B1F] mb-4">¡Revisa tu correo!</h1>
        <p className="text-[#49454F] mb-8 leading-relaxed">
          Te hemos enviado un enlace de confirmación a tu correo electrónico. Por favor, revisa tu bandeja de entrada y
          haz clic en el enlace para activar tu cuenta.
        </p>
        <Link href="/bienvenida">
          <Button className="w-full bg-[#6750A4] hover:bg-[#7965AF] text-white rounded-full h-12 font-semibold">
            Volver al inicio
          </Button>
        </Link>
      </div>
    </div>
  )
}
