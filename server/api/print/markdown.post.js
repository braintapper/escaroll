// /server/api/print/markdown.post.js
import { parseMarkdown } from "../../utils/parseMarkdown.js"
import { substitute } from "../../utils/substitute.js"
import { buildBuffer } from "../../utils/buildBuffer.js"
import { sendToPrinter } from "../../utils/printer.js"
import { INIT, LF_CMD, CUT } from "../../utils/escpos.js"

// Body: { header?: string, body?: string, footer?: string, dither?: boolean, threshold?: number }
export default defineEventHandler(async (event) => {
  const { header = "", body = "", footer = "", dither = true, threshold = 128, tableGap = 2 } = await readBody(event)
  const mdOpts = { tableGap }

  const descriptors = [
    ...parseMarkdown(substitute(header), mdOpts),
    ...parseMarkdown(substitute(body),   mdOpts),
    ...parseMarkdown(substitute(footer), mdOpts),
  ]

  const imgOpts = { dither, threshold }
  const parts   = [INIT, ...(await buildBuffer(descriptors, imgOpts)), LF_CMD, LF_CMD, LF_CMD, CUT]

  const config = useRuntimeConfig()
  const buffer = Buffer.concat(parts)
  return sendToPrinter(config.printerIp, Number(config.printerPort), buffer)
})
