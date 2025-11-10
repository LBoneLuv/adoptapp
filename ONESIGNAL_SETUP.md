# Configuración de OneSignal para Notificaciones Push

Esta guía te ayudará a configurar OneSignal para recibir notificaciones push en Adoptapp.

## Pasos para configurar OneSignal

### 1. Crear cuenta en OneSignal

1. Ve a [OneSignal.com](https://onesignal.com) y crea una cuenta gratuita
2. Haz clic en "New App/Website"
3. Selecciona "Web Push" como plataforma
4. Nombra tu aplicación (ej: "Adoptapp")

### 2. Configurar Web Push

1. En la configuración de Web Push, elige "Typical Site"
2. Ingresa tu URL de producción (ej: `https://tu-dominio.com`)
3. Completa la configuración de permisos y apariencia de las notificaciones
4. Guarda la configuración

### 3. Obtener las credenciales

Necesitarás dos valores de OneSignal:

1. **App ID**: Lo encuentras en Settings → Keys & IDs → OneSignal App ID
2. **REST API Key**: Lo encuentras en Settings → Keys & IDs → REST API Key

### 4. Configurar variables de entorno en Vercel

Ve a tu proyecto en Vercel y agrega estas variables de entorno:

\`\`\`
NEXT_PUBLIC_ONESIGNAL_APP_ID=tu-app-id-aqui
ONESIGNAL_REST_API_KEY=tu-rest-api-key-aqui
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
\`\`\`

**Importante:**
- `NEXT_PUBLIC_ONESIGNAL_APP_ID` debe tener el prefijo `NEXT_PUBLIC_` para que esté disponible en el cliente
- `ONESIGNAL_REST_API_KEY` NO debe tener el prefijo (es solo para el servidor)
- `NEXT_PUBLIC_SITE_URL` debe ser tu URL de producción

### 5. Configurar Safari Web Push (Opcional)

Si quieres soporte para Safari en iOS/macOS:

1. En OneSignal, ve a Settings → Platforms → Apple Safari
2. Sigue los pasos para generar un certificado de Safari
3. Guarda el Safari Web ID
4. Agrega esta variable de entorno:

\`\`\`
NEXT_PUBLIC_ONESIGNAL_SAFARI_WEB_ID=tu-safari-web-id
\`\`\`

### 6. Ejecutar el script SQL

Ejecuta el script `scripts/018_add_onesignal_player_id.sql` en tu base de datos Supabase para agregar la columna necesaria:

\`\`\`sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onesignal_player_id TEXT;
CREATE INDEX IF NOT EXISTS idx_profiles_onesignal_player_id ON profiles(onesignal_player_id);
\`\`\`

### 7. Desplegar y probar

1. Despliega tu aplicación a Vercel
2. Abre la aplicación en tu navegador
3. Acepta los permisos de notificaciones cuando se soliciten
4. Envía un mensaje de prueba desde otra cuenta
5. Deberías recibir una notificación push

## Cómo funciona

1. **Inicialización**: Cuando un usuario abre la app, `OneSignalProvider` inicializa OneSignal y guarda su `player_id` en la base de datos
2. **Etiquetado**: El sistema identifica automáticamente si el usuario es una protectora o usuario regular y añade tags en OneSignal
3. **Envío de mensajes**: Cuando se envía un mensaje en el chat, se llama a `/api/notifications/send-message` que usa la API de OneSignal para enviar la notificación al receptor
4. **Recepción**: El receptor recibe la notificación incluso si la app está cerrada (gracias al Service Worker)

## Troubleshooting

### Las notificaciones no llegan

1. Verifica que las variables de entorno estén correctamente configuradas
2. Asegúrate de que el usuario haya aceptado los permisos de notificaciones
3. Revisa la consola del navegador para errores de OneSignal
4. Verifica en OneSignal Dashboard → Delivery que las notificaciones se estén enviando

### El player_id no se guarda

1. Verifica que la columna `onesignal_player_id` exista en la tabla `profiles`
2. Asegúrate de que el script SQL se haya ejecutado correctamente
3. Revisa los permisos RLS de la tabla `profiles`

### Notificaciones duplicadas

1. Asegúrate de que solo hay un `OneSignalProvider` en tu aplicación (en el layout raíz)
2. Verifica que no tengas múltiples service workers registrados

## Recursos adicionales

- [Documentación oficial de OneSignal](https://documentation.onesignal.com/)
- [OneSignal Web Push Quickstart](https://documentation.onesignal.com/docs/web-push-quickstart)
- [OneSignal REST API](https://documentation.onesignal.com/reference/create-notification)
