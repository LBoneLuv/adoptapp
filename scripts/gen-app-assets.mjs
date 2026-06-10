import sharp from "sharp"
import { readFileSync, writeFileSync } from "fs"

const PURPLE = "#6750A4"
const W = "#ffffff"
const markSvg = readFileSync("public/arko-logo.svg", "utf8").replaceAll("#6750a5", W)
const fullSvg = readFileSync("public/arko-full-logo.svg", "utf8").replaceAll("#6750a5", W)

async function pngFromSvg(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size, { fit: "contain", background: { r:0,g:0,b:0,alpha:0 } }).png().toBuffer()
}
function solid(size, color) {
  return sharp({ create: { width: size, height: size, channels: 4, background: color } }).png()
}

// --- ICON ---
// foreground: white mark on transparent (within adaptive safe zone)
const markFg = await pngFromSvg(markSvg, 600)
await solid(1024, { r:0,g:0,b:0,alpha:0 }).composite([{ input: markFg, gravity: "center" }]).toFile("assets/icon-foreground.png")
// background: solid purple
await solid(1024, PURPLE).toFile("assets/icon-background.png")
// icon-only: white mark on purple
const markIcon = await pngFromSvg(markSvg, 600)
await solid(1024, PURPLE).composite([{ input: markIcon, gravity: "center" }]).toFile("assets/icon-only.png")

// --- SPLASH (2732x2732, morado + logo completo blanco + lema) ---
const SP = 2732
const logo = await pngFromSvg(fullSvg, 1000)
const sloganSvg = `<svg width="2200" height="520" xmlns="http://www.w3.org/2000/svg">
  <style>text{font-family:'DejaVu Sans','Arial',sans-serif;font-weight:700;}</style>
  <text x="1100" y="190" text-anchor="middle" font-size="120" fill="#ffffff">Todo para tu mascota,</text>
  <text x="1100" y="360" text-anchor="middle" font-size="120" fill="#ffffff">en un solo lugar</text>
</svg>`
const slogan = await sharp(Buffer.from(sloganSvg)).png().toBuffer()
await solid(SP, PURPLE).composite([
  { input: logo, top: Math.round(SP/2 - 1000/2 - 230), left: Math.round(SP/2 - 1000/2) },
  { input: slogan, top: Math.round(SP/2 + 360), left: Math.round(SP/2 - 2200/2) },
]).toFile("assets/splash.png")
// dark = igual
await solid(SP, PURPLE).composite([
  { input: logo, top: Math.round(SP/2 - 1000/2 - 230), left: Math.round(SP/2 - 1000/2) },
  { input: slogan, top: Math.round(SP/2 + 360), left: Math.round(SP/2 - 2200/2) },
]).toFile("assets/splash-dark.png")

console.log("OK: assets generados")
