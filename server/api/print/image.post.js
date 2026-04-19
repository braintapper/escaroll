// /server/api/print/image.post.js
import { imageToRaster } from "../../utils/rasterize.js"
import { sendToPrinter } from "../../utils/printer.js"
import { INIT, align, rasterImage, LF_CMD, CUT } from "../../utils/escpos.js"

// Body: { imagePath: string, dither?: boolean, threshold?: number }
export default defineEventHandler(async (event) => {
  const { imagePath, dither = true, threshold = 128 } = await readBody(event)

  if (!imagePath) throw createError({ statusCode: 400, message: "imagePath required" })

  const { raster, widthBytes, width, height } = await imageToRaster(imagePath, { dither, threshold })

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
