import type { CapacitorConfig } from "@capacitor/cli"

// Arko se empaqueta como app nativa (WebView) que carga la web ya desplegada
// en Vercel. Para usar un dominio propio, cambia `server.url` y reconstruye.
const config: CapacitorConfig = {
  appId: "com.arko.adoptapp",
  appName: "Arko",
  webDir: "native/www",
  server: {
    url: "https://v0-adoptapp-mobile-screen.vercel.app",
    androidScheme: "https",
    cleartext: false,
  },
  android: {
    backgroundColor: "#FEF7FF",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1200,
      backgroundColor: "#6750A4",
      showSpinner: false,
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#FFFBFE",
    },
  },
}

export default config
