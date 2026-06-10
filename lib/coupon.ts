export interface CouponRow {
  id?: string
  code: string
  discount_type: "percent" | "fixed"
  discount_value: number
  min_order: number | null
  active: boolean
  expires_at: string | null
  usage_limit: number | null
  used_count: number
}

// Valida un cupón contra el subtotal y devuelve el descuento aplicable.
export function validateCoupon(
  coupon: CouponRow | null | undefined,
  subtotal: number,
): { ok: boolean; discount: number; reason?: string } {
  if (!coupon) return { ok: false, discount: 0, reason: "Código no válido" }
  if (!coupon.active) return { ok: false, discount: 0, reason: "Cupón no disponible" }
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
    return { ok: false, discount: 0, reason: "Cupón caducado" }
  if (coupon.usage_limit != null && coupon.used_count >= coupon.usage_limit)
    return { ok: false, discount: 0, reason: "Cupón agotado" }
  if (coupon.min_order && subtotal < coupon.min_order)
    return { ok: false, discount: 0, reason: `Pedido mínimo de ${coupon.min_order.toFixed(2)}€` }

  let discount = coupon.discount_type === "percent" ? subtotal * (coupon.discount_value / 100) : coupon.discount_value
  discount = Math.min(discount, subtotal)
  discount = Math.round(discount * 100) / 100
  return { ok: true, discount }
}
