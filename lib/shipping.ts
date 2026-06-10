// Configuración de envíos de la tienda.
export const FREE_SHIPPING_THRESHOLD = 50 // € — envío estándar gratis a partir de aquí

export interface ShippingMethod {
  id: string
  label: string
  detail: string
  cost: number
}

export const SHIPPING_METHODS: ShippingMethod[] = [
  { id: "standard", label: "Envío estándar", detail: "3-5 días laborables", cost: 3.99 },
  { id: "express", label: "Envío exprés", detail: "24-48 horas", cost: 6.99 },
]

// Coste de envío según método y subtotal (tras descuento).
export function shippingCost(methodId: string, subtotal: number): number {
  if (methodId === "standard" && subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  const m = SHIPPING_METHODS.find((x) => x.id === methodId)
  return m ? m.cost : 0
}
