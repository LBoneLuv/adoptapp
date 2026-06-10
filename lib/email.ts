// Envío de emails — preparado pero inactivo hasta configurar el proveedor.
// Cuando quieras activarlo, define en el entorno:
//   RESEND_API_KEY   (https://resend.com — API por HTTP, sin SMTP)
//   EMAIL_FROM       p.ej. "Arko <hola@tudominio.com>"
// Mientras no estén definidas, sendEmail() simplemente registra y no envía.

interface SendArgs {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendArgs): Promise<{ ok: boolean; skipped?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!apiKey || !from || !to) {
    console.log(`[email] no enviado (proveedor no configurado). Para: ${to} | Asunto: ${subject}`)
    return { ok: false, skipped: true }
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    })
    if (!res.ok) {
      console.error("[email] error:", await res.text())
      return { ok: false }
    }
    return { ok: true }
  } catch (e) {
    console.error("[email] error:", e)
    return { ok: false }
  }
}

interface OrderEmailItem {
  product_name: string
  quantity: number
  unit_price: number
}

export function orderConfirmationHtml(opts: {
  orderId: string
  name?: string | null
  items: OrderEmailItem[]
  total: number
  discount?: number | null
  couponCode?: string | null
}): string {
  const rows = opts.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 0;color:#1C1B1F">${i.quantity}× ${i.product_name}</td><td style="padding:8px 0;text-align:right;color:#49454F">${(i.unit_price * i.quantity).toFixed(2)}€</td></tr>`,
    )
    .join("")
  const discountRow =
    opts.discount && opts.discount > 0
      ? `<tr><td style="padding:4px 0;color:#1E7E34">Descuento ${opts.couponCode ? `(${opts.couponCode})` : ""}</td><td style="padding:4px 0;text-align:right;color:#1E7E34">−${opts.discount.toFixed(2)}€</td></tr>`
      : ""
  return `<!doctype html><html><body style="margin:0;background:#FEF7FF;font-family:-apple-system,system-ui,sans-serif">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#6750A4;border-radius:20px;padding:28px;text-align:center">
      <h1 style="color:#fff;margin:0;font-size:22px">¡Gracias por tu pedido!</h1>
    </div>
    <div style="background:#fff;border-radius:20px;padding:24px;margin-top:16px">
      <p style="color:#1C1B1F">Hola${opts.name ? " " + opts.name : ""}, hemos recibido tu pedido <strong>#${opts.orderId.slice(0, 8).toUpperCase()}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px">${rows}${discountRow}
        <tr><td style="padding-top:12px;border-top:1px solid #E8DEF8;font-weight:bold;color:#1C1B1F">Total</td>
        <td style="padding-top:12px;border-top:1px solid #E8DEF8;text-align:right;font-weight:bold;color:#6750A4">${opts.total.toFixed(2)}€</td></tr>
      </table>
      <p style="color:#79747E;font-size:13px;margin-top:20px">Te avisaremos cuando tu pedido cambie de estado. ¡Gracias por confiar en Arko!</p>
    </div>
  </div></body></html>`
}
