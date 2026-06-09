// Traduce los errores de Supabase Auth (en inglés) a mensajes en español.
// Prioriza el código de error y, si no, busca por el texto del mensaje.
export function translateAuthError(error: unknown): string {
  const e = error as { code?: string; message?: string } | null
  const code = e?.code || ""
  const msg = (e?.message || "").toLowerCase()

  const byCode: Record<string, string> = {
    invalid_credentials: "Correo o contraseña incorrectos.",
    email_not_confirmed: "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.",
    user_already_exists: "Ya existe una cuenta con este correo.",
    email_exists: "Ya existe una cuenta con este correo.",
    over_email_send_rate_limit: "Se han enviado demasiados correos. Espera unos minutos e inténtalo de nuevo.",
    over_request_rate_limit: "Demasiados intentos. Espera un momento e inténtalo de nuevo.",
    weak_password: "La contraseña es demasiado débil (mínimo 6 caracteres).",
    validation_failed: "Revisa los datos introducidos.",
    signup_disabled: "El registro está deshabilitado temporalmente.",
    user_not_found: "No existe ninguna cuenta con esos datos.",
    same_password: "La nueva contraseña debe ser distinta de la actual.",
  }
  if (code && byCode[code]) return byCode[code]

  if (msg.includes("invalid login credentials")) return "Correo o contraseña incorrectos."
  if (msg.includes("email not confirmed")) return "Debes confirmar tu correo antes de iniciar sesión. Revisa tu bandeja de entrada."
  if (msg.includes("already registered") || msg.includes("already been registered") || msg.includes("user already"))
    return "Ya existe una cuenta con este correo."
  if (msg.includes("email rate limit") || msg.includes("rate limit") || msg.includes("rate_limit"))
    return "Se han enviado demasiados correos. Espera unos minutos e inténtalo de nuevo."
  if (msg.includes("password should be at least")) return "La contraseña debe tener al menos 6 caracteres."
  if (msg.includes("weak password") || msg.includes("password")) return "La contraseña no es válida (mínimo 6 caracteres)."
  if (msg.includes("unable to validate email") || msg.includes("invalid format") || msg.includes("invalid email"))
    return "El formato del correo no es válido."
  if (msg.includes("for security purposes") && msg.includes("second"))
    return "Por seguridad, espera unos segundos antes de volver a intentarlo."
  if (msg.includes("signups not allowed") || msg.includes("signup is disabled"))
    return "El registro está deshabilitado temporalmente."
  if (msg.includes("network") || msg.includes("failed to fetch") || msg.includes("fetch"))
    return "Error de conexión. Comprueba tu internet e inténtalo de nuevo."

  return "Ha ocurrido un error. Inténtalo de nuevo."
}
