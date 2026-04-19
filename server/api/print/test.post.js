// /server/api/print/test.post.js
import { sendToPrinter } from "../../utils/printer.js"
import { INIT, align, bold, textSize, text, LF_CMD, CUT } from "../../utils/escpos.js"

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const now = new Date().toLocaleString("en-CA", { timeZone: "America/Toronto" })

  const buffer = Buffer.concat([
    INIT,
    align(1),
    bold(true),
    textSize(2, 2),
    text("TEST PRINT\n"),
    textSize(1, 1),
    bold(false),
    text("--------------------------------\n"),
    align(0),
    text(`Printer: ${config.printerIp}:${config.printerPort}\n`),
    text(`Time:    ${now}\n`),
    align(1),
    text("--------------------------------\n"),
    text("ESC/POS over TCP OK\n"),
    LF_CMD,
    LF_CMD,
    LF_CMD,
    CUT,
  ])

  return sendToPrinter(config.printerIp, Number(config.printerPort), buffer)
})
