// /server/api/print/image.post.js
import sharp from "sharp"
import { readFile } from "fs/promises"
import { sendToPrinter } from "../../utils/printer.js"
import { INIT, align, rasterImage, LF_CMD, CUT } from "../../utils/escpos.js"

const PRINT_WIDTH_DOTS = 576

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))

// Floyd-Steinberg dithering on a flat uint8 grayscale buffer.
// Quantization error is diffused to 4 neighbours (right, bottom-left, bottom, bottom-right)
// using the standard 7/16, 3/16, 5/16, 1/16 weights.
const floydSteinberg = (pixels, width, height) => {
  const buf = Buffer.from(pixels)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = y * width + x
      const oldVal  = buf[i]
      const newVal  = oldVal < 128 ? 0 : 255
      const err     = oldVal - newVal
      buf[i] = newVal

      if (x + 1 < width)
        buf[i + 1]         = clamp(buf[i + 1]         + err * 7 / 16)
      if (y + 1 < height) {
        if (x - 1 >= 0)
          buf[i + width - 1] = clamp(buf[i + width - 1] + err * 3 / 16)
        buf[i + width]       = clamp(buf[i + width]     + err * 5 / 16)
        if (x + 1 < width)
          buf[i + width + 1] = clamp(buf[i + width + 1] + err * 1 / 16)
      }
    }
  }

  return buf
}

// Pack a flat uint8 grayscale buffer (values 0 or 255) into 1-bit ESC/POS raster rows.
// A 0 (black) pixel maps to bit 1; 255 (white) maps to bit 0. MSB first.
const packRaster = (pixels, width, height) => {
  const widthBytes = Math.ceil(width / 8)
  const raster = Buffer.alloc(widthBytes * height, 0x00)

  for (let y = 0; y < height; y++) {
    for (let bx = 0; bx < widthBytes; bx++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        const px = bx * 8 + bit
        if (px < width && pixels[y * width + px] === 0) {
          byte |= (0x80 >> bit)
        }
      }
      raster[y * widthBytes + bx] = byte
    }
  }

  return { raster, widthBytes }
}

// Body: { imagePath: string, dither?: boolean, threshold?: number }
export default defineEventHandler(async (event) => {
  const { imagePath, dither = false, threshold = 128 } = await readBody(event)

  if (!imagePath) throw createError({ statusCode: 400, message: "imagePath required" })

  const raw = await readFile(imagePath)

  const resized = sharp(raw)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(PRINT_WIDTH_DOTS, null, { fit: "inside", withoutEnlargement: false })
    .grayscale()

  let pixels, width, height

  if (dither) {
    const { data, info } = await resized.raw().toBuffer({ resolveWithObject: true })
    const dithered = floydSteinberg(data, info.width, info.height)
    pixels = dithered
    width  = info.width
    height = info.height
  } else {
    const { data, info } = await resized.threshold(threshold).raw().toBuffer({ resolveWithObject: true })
    pixels = data
    width  = info.width
    height = info.height
  }

  const { raster, widthBytes } = packRaster(pixels, width, height)

  const config = useRuntimeConfig()

  const buffer = Buffer.concat([
    INIT,
    align(1),
    rasterImage(raster, widthBytes, height),
    LF_CMD,
    LF_CMD,
    LF_CMD,
    CUT,
  ])

  const result = await sendToPrinter(config.printerIp, Number(config.printerPort), buffer)
  return { ...result, width, height, dither, threshold }
})
