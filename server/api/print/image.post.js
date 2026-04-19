// /server/api/print/image.post.js
import sharp from "sharp"
import { readFile } from "fs/promises"
import { sendToPrinter } from "../../utils/printer.js"
import { INIT, align, rasterImage, LF_CMD, CUT } from "../../utils/escpos.js"

const PRINT_WIDTH_DOTS = 576

// Body: { imagePath: string, threshold?: number (0-255, default 128) }
export default defineEventHandler(async (event) => {
  const { imagePath, threshold = 128 } = await readBody(event)

  if (!imagePath) throw createError({ statusCode: 400, message: "imagePath required" })

  const raw = await readFile(imagePath)

  const { data, info } = await sharp(raw)
    .resize(PRINT_WIDTH_DOTS, null, { fit: "inside", withoutEnlargement: false })
    .grayscale()
    .threshold(threshold)
    .raw()
    .toBuffer({ resolveWithObject: true })

  const widthBytes = Math.ceil(info.width / 8)
  const heightDots = info.height
  const raster = Buffer.alloc(widthBytes * heightDots, 0x00)

  // Pack 8-bit threshold output (0=black, 255=white) into 1-bit rows
  // ESC/POS: bit 1 = black dot, MSB first
  for (let y = 0; y < heightDots; y++) {
    for (let bx = 0; bx < widthBytes; bx++) {
      let byte = 0
      for (let bit = 0; bit < 8; bit++) {
        const px = bx * 8 + bit
        if (px < info.width && data[y * info.width + px] === 0) {
          byte |= (0x80 >> bit)
        }
      }
      raster[y * widthBytes + bx] = byte
    }
  }

  const config = useRuntimeConfig()

  const buffer = Buffer.concat([
    INIT,
    align(1),
    rasterImage(raster, widthBytes, heightDots),
    LF_CMD,
    LF_CMD,
    LF_CMD,
    CUT,
  ])

  const result = await sendToPrinter(config.printerIp, Number(config.printerPort), buffer)
  return { ...result, width: info.width, height: heightDots, threshold }
})
