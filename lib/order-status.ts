export const ORDER_STATUS: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pendiente de pago", cls: "text-[#B26A00] bg-[#FFF4E5]" },
  paid: { label: "Pagado", cls: "text-[#1E7E34] bg-[#E6F4EA]" },
  processing: { label: "En preparación", cls: "text-[#1565C0] bg-[#E3F2FD]" },
  shipped: { label: "Enviado", cls: "text-[#6750A4] bg-[#E8DEF8]" },
  delivered: { label: "Entregado", cls: "text-[#1E7E34] bg-[#E6F4EA]" },
  cancelled: { label: "Cancelado", cls: "text-[#C5221F] bg-[#FDECEA]" },
}

export const ORDER_STATUS_OPTIONS = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"] as const
