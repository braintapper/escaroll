// /server/utils/buildBuffer.js
import { imageToRaster } from "./rasterize.js"
import figlet from "figlet"
import { align, bold, font, italic, underline, textSize, text, rasterImage, barcode, barcodeHeight, barcodeWidth, barcodeHRI, qrCode, LF_CMD, HR, HR_UNDERLINE } from "./escpos.js"

const BARCODE_TYPES = {
  upca:    65,
  upce:    66,
  ean13:   67,
  ean8:    68,
  code39:  69,
  itf:     70,
  codabar: 71,
  code93:  72,
  code128: 73,
}

const CHARS_FONT_A = 48
const CHARS_FONT_B = 64

// Split content into segments with format type: plain | bold | italic | underline | fontb
// **text** = bold, *text* = italic, _text_ = underline, `text` = Font B
const parseInlineFormats = (content) => {
  const segments = []
  const re       = /\*\*([^*]+)\*\*|`([^`]+)`|\*([^*]+)\*|_([^_]+)_/g
  let lastIndex  = 0
  let match

  while ((match = re.exec(content)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ fmt: "plain", text: content.slice(lastIndex, match.index) })
    }
    if (match[1] !== undefined) segments.push({ fmt: "bold",      text: match[1] })
    else if (match[2] !== undefined) segments.push({ fmt: "fontb", text: match[2] })
    else if (match[3] !== undefined) segments.push({ fmt: "italic",    text: match[3] })
    else if (match[4] !== undefined) segments.push({ fmt: "underline", text: match[4] })
    lastIndex = match.index + match[0].length
  }
  if (lastIndex < content.length) {
    segments.push({ fmt: "plain", text: content.slice(lastIndex) })
  }

  return segments
}

const descriptorToBuffers = async (descriptor, imgOpts) => {
  if (descriptor.type === "lf")   return [LF_CMD]
  if (descriptor.type === "font") return [font(descriptor.value)]

  if (descriptor.type === "qr") {
    return [
      align(descriptor.qAlign),
      qrCode(descriptor.data, { size: descriptor.qSize, ec: descriptor.qEC }),
      LF_CMD,
      align(0),
    ]
  }

  if (descriptor.type === "barcode") {
    const typeCode = BARCODE_TYPES[descriptor.bType] ?? BARCODE_TYPES.code128
    return [
      align(descriptor.bAlign),
      barcodeHeight(descriptor.bHeight),
      barcodeWidth(descriptor.bWidth),
      barcodeHRI(descriptor.bHRI),
      barcode(typeCode, descriptor.data),
      LF_CMD,
      align(0),
    ]
  }

  if (descriptor.type === "figlet") {
    const width    = descriptor.fontb ? CHARS_FONT_B : CHARS_FONT_A
    const rendered = figlet.textSync(descriptor.content, {
      font:             descriptor.figletFont,
      horizontalLayout: descriptor.hLayout,
      verticalLayout:   descriptor.vLayout,
      width,
      whitespaceBreak:  true,
    })
    const lines = rendered.split("\n")
    const parts = descriptor.fontb ? [font(1)] : []
    for (const line of lines) parts.push(text(line + "\n"))
    if (descriptor.fontb) parts.push(font(0))
    return parts
  }

  if (descriptor.type === "hr") {
    return descriptor.char === "_"
      ? [align(0), bold(false), textSize(1, 1), HR_UNDERLINE, LF_CMD]
      : [align(0), bold(false), textSize(1, 1), HR]
  }

  if (descriptor.type === "image") {
    const { raster, widthBytes, height } = await imageToRaster(descriptor.path, {
      ...imgOpts,
      wPct:   descriptor.wPct,
      hPct:   descriptor.hPct,
      dither: descriptor.dither ?? imgOpts.dither,
    })
    return [align(descriptor.align), rasterImage(raster, widthBytes, height), align(0)]
  }

  // Bold descriptors (headings, table headers) — emit as a single run, skip inline parsing
  if (descriptor.bold) {
    return [
      align(descriptor.align ?? 0),
      bold(true),
      textSize(...(descriptor.size ?? [1, 1])),
      text(descriptor.content + "\n"),
      bold(false),
      textSize(1, 1),
      align(0),
    ]
  }

  // Non-bold descriptors — parse inline format spans
  const segments = parseInlineFormats(descriptor.content)
  const parts    = [
    align(descriptor.align ?? 0),
    textSize(...(descriptor.size ?? [1, 1])),
  ]

  for (const seg of segments) {
    switch (seg.fmt) {
      case "bold":
        parts.push(bold(true),      text(seg.text), bold(false))
        break
      case "italic":
        parts.push(italic(true),    text(seg.text), italic(false))
        break
      case "underline":
        parts.push(underline(1),    text(seg.text), underline(0))
        break
      case "fontb":
        parts.push(font(1),         text(seg.text), font(0))
        break
      default:
        parts.push(text(seg.text))
    }
  }

  parts.push(bold(false), text("\n"), textSize(1, 1), align(0))
  return parts
}

// Convert an array of parsed markdown descriptors into a flat array of ESC/POS Buffers.
export const buildBuffer = async (descriptors, imgOpts) => {
  const parts = []
  for (const descriptor of descriptors) {
    parts.push(...await descriptorToBuffers(descriptor, imgOpts))
  }
  return parts
}
