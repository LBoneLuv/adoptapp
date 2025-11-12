import { put } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"

// This script processes beach images from the KML file
// Downloads them from Google Maps and uploads to Vercel Blob Storage

const beachImages = [
  {
    name: "Playa de la Rubina",
    googleUrl:
      "https://mymaps.usercontent.google.com/hostedimage/m/*/3AKcrxGTTuMoVACaIRlc5HZjJdYrQpt5j7bn9hz-u81o_BXTQKlBszvCQaAZ-RqkGLaTJTODXD8z7lT6GWJHJNty55tT10VaVLartKS8t0OQGnhq7dnCgTndIXPDOGLsKtooWk6FJY52hiRK4ec4fJ6gcTAvYcLK1WfK-tc8QuM_3fI3Jkp9diM_xvIV6XCL0u39Ws68GGT2Bw_H6Kw?authuser=0&fife=s16383",
  },
  {
    name: "Playa La Picòrdia",
    googleUrl: "https://www.redcanina.es/wp-content/uploads/2016/03/playa-canina-la-picordia-arenys-de-mar.jpg",
  },
  // Add more beaches here...
]

async function processBeachImages() {
  console.log("[v0] Starting beach image processing...")

  for (const beach of beachImages) {
    try {
      console.log(`[v0] Processing ${beach.name}...`)

      // Download image from Google Maps
      const response = await fetch(beach.googleUrl)
      if (!response.ok) {
        console.error(`[v0] Failed to download image for ${beach.name}`)
        continue
      }

      const blob = await response.blob()

      // Create a safe filename
      const safeFilename = beach.name
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")

      // Upload to Vercel Blob with .jpg extension
      const { url } = await put(`beaches/${safeFilename}.jpg`, blob, {
        access: "public",
        contentType: "image/jpeg",
      })

      console.log(`[v0] Uploaded ${beach.name}: ${url}`)

      // Update database
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

      await supabase.from("dog_beaches").update({ image_url: url }).eq("name", beach.name)

      console.log(`[v0] Updated database for ${beach.name}`)
    } catch (error) {
      console.error(`[v0] Error processing ${beach.name}:`, error)
    }
  }

  console.log("[v0] Beach image processing complete!")
}

processBeachImages()
