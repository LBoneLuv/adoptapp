import type React from "react"
import type { Metadata } from "next"

import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { OneSignalProvider } from "@/components/onesignal-provider"

// Initialize fonts
import { Poppins } from "next/font/google"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Adoptapp - Adopción de Mascotas",
  description: "Encuentra tu compañero perfecto",
  generator: "v0.app",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Adoptapp",
  },
  applicationName: "Adoptapp",
  themeColor: "#6750A4",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    icon: [
      { url: "/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icon-152x152.png", sizes: "152x152", type: "image/png" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="apple-touch-icon" href="/icon-152x152.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Adoptapp" />
        <meta name="mobile-web-app-capable" content="yes" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(
                    (registration) => {
                      console.log('SW registered:', registration);
                    },
                    (error) => {
                      console.log('SW registration failed:', error);
                    }
                  );
                });
              }
            `,
          }}
        />
      </head>
      <body className={`${poppins.variable} font-sans antialiased`}>
        <OneSignalProvider />
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  )
}
