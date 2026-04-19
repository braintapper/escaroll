// /server/api/print/template.post.js
import { loadTemplate } from "../../utils/loadTemplate.js"
import { renderTemplate } from "../../utils/renderTemplate.js"
import { parseMarkdown } from "../../utils/parseMarkdown.js"
import { buildBuffer } from "../../utils/buildBuffer.js"
import { sendToPrinter } from "../../utils/printer.js"
import { INIT, LF_CMD, CUT } from "../../utils/escpos.js"

// Body: { templateName: string, data?: object, dither?: boolean, threshold?: number }
export default defineEventHandler(async (event) => {
  const { templateName, data = {}, dither = true, threshold = 128 } = await readBody(event)

  if (!templateName) throw createError({ statusCode: 400, message: "templateName required" })

  const config   = useRuntimeConfig()
  const template = await loadTemplate(templateName, config.templatesPath)
  const rendered = renderTemplate(template, data)
  const mdOpts   = template.options

  const descriptors = [
    ...parseMarkdown(rendered.header, mdOpts),
    ...parseMarkdown(rendered.body,   mdOpts),
    ...parseMarkdown(rendered.footer, mdOpts),
  ]

  const imgOpts = { dither, threshold }
  const parts   = [INIT, ...(await buildBuffer(descriptors, imgOpts)), LF_CMD, LF_CMD, LF_CMD, CUT]

  const buffer = Buffer.concat(parts)
  return sendToPrinter(config.printerIp, Number(config.printerPort), buffer)
})
