// /server/utils/rasterize.js
import sharp from "sharp"
import { readFile } from "fs/promises"

const PRINT_WIDTH_DOTS = 576

const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))

// Floyd-Steinberg dithering on a flat uint8 grayscale buffer (in-place copy).
const floydSteinberg = (pixels, width, height) => {
  const buf = Buffer.from(pixels)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i      = y * width + x
      const oldVal = buf[i]
      const newVal = oldVal < 128 ? 0 : 255
      const err    = oldVal - newVal
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
// 0 (black) → bit 1, 255 (white) → bit 0, MSB first.
const packRaster = (pixels, width, height) => {
  const widthBytes = Math.ceil(width / 8)
  const raster     = Buffer.alloc(widthBytes * height, 0x00)

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

// Convert an image file to a 1-bit ESC/POS raster buffer.
// Options:
//   dither    bool   Floyd-Steinberg dithering (default false)
//   threshold 0-255  hard threshold when dither is false (default 128)
//   wPct      1-100  width as % of print width (default 100)
//   hPct      1+     height as % of proportional height after width resize (default 100)
export const imageToRaster = async (imagePath, { dither = true, threshold = 128, wPct = 100, hPct = 100 } = {}) => {
  const raw         = await readFile(imagePath)
  const targetWidth = Math.max(1, Math.round(PRINT_WIDTH_DOTS * wPct / 100))

  // When hPct is not 100 we need the natural height at targetWidth first,
  // then compress/stretch to hPct of that — requires a metadata pre-read.
  let resizeOpts
  if (hPct !== 100) {
    const meta             = await sharp(raw).metadata()
    const naturalHeight    = Math.round(meta.height * targetWidth / meta.width)
    const targetHeight     = Math.max(1, Math.round(naturalHeight * hPct / 100))
    resizeOpts = [targetWidth, targetHeight, { fit: "fill" }]
  } else {
    resizeOpts = [targetWidth, null, { fit: "inside", withoutEnlargement: false }]
  }

  const resized = sharp(raw)
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(...resizeOpts)
    .grayscale()

  let pixels, width, height

  if (dither) {
    const { data, info } = await resized.raw().toBuffer({ resolveWithObject: true })
    pixels = floydSteinberg(data, info.width, info.height)
    width  = info.width
    height = info.height
  } else {
    const { data, info } = await resized.threshold(threshold).raw().toBuffer({ resolveWithObject: true })
    pixels = data
    width  = info.width
    height = info.height
  }

  const { raster, widthBytes } = packRaster(pixels, width, height)
  return { raster, widthBytes, width, height }
}
