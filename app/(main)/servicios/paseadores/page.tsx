"use client"

import { ProfessionalsDirectory } from "@/components/professionals-directory"
import { PROFESSIONAL_TYPES } from "@/lib/professionals-config"

export default function PaseadoresPage() {
  return <ProfessionalsDirectory config={PROFESSIONAL_TYPES.paseador} />
}
