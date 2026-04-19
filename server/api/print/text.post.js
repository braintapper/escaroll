// /server/api/print/text.post.js
import { sendToPrinter } from "../../utils/printer.js"
import { INIT, align, bold, textSize, text, LF_CMD, CUT } from "../../utils/escpos.js"

// Body: { lines: Line[], cut?: boolean }
// Line: { content: string, align?: 0|1|2, bold?: boolean, size?: [w, h] }
export default defineEventHandler(async (event) => {
  const { lines = [], cut = true } = await readBody(event)
  const config = useRuntimeConfig()

  const parts = [INIT]

  for (const line of lines) {
    if (line.align !== undefined) parts.push(align(line.align))
    if (line.bold !== undefined) parts.push(bold(line.bold))
    if (line.size)               parts.push(textSize(...line.size))

    parts.push(text(line.content + "\n"))

    // Reset per-line formatting so lines are independent
    parts.push(bold(false))
    parts.push(textSize(1, 1))
    parts.push(align(0))
  }

  parts.push(LF_CMD)
  parts.push(LF_CMD)
  parts.push(LF_CMD)
  if (cut) parts.push(CUT)

  const buffer = Buffer.concat(parts)
  return sendToPrinter(config.printerIp, Number(config.printerPort), buffer)
})
