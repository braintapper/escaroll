// /server/utils/escpos.js

const ESC = 0x1B
const GS  = 0x1D
const LF  = 0x0A

// Printer initialization — clears settings, resets to defaults
export const INIT = Buffer.from([ESC, 0x40])

export const LF_CMD = Buffer.from([LF])

// Partial cut with small paper feed
export const CUT = Buffer.from([GS, 0x56, 0x41, 0x03])

// Full-width separators — 48 chars at normal size (576 dots ÷ 12 dots/char on RP332)
export const HR           = Buffer.from("------------------------------------------------\n", "utf8")
export const HR_UNDERLINE = Buffer.from("________________________________________________\n", "utf8")

// Alignment: 0 = left, 1 = center, 2 = right
export const align = (mode) => Buffer.from([ESC, 0x61, mode])

// ESC M n — character font. 0 = Font A (12 dots wide, default), 1 = Font B (9 dots wide)
export const font = (n) => Buffer.from([ESC, 0x4D, n])

// Text emphasis
export const bold      = (on) => Buffer.from([ESC, 0x45, on ? 1 : 0])

// ESC - n — underline. 0 = off, 1 = single, 2 = double
export const underline = (n)  => Buffer.from([ESC, 0x2D, n])

// ESC 4 / ESC 5 — italic on/off. Support varies by printer firmware.
export const italic    = (on) => Buffer.from([ESC, on ? 0x34 : 0x35])

// Character size multiplier — width and height each 1–8
export const textSize = (width, height) => {
  const byte = ((width - 1) << 4) | (height - 1)
  return Buffer.from([GS, 0x21, byte])
}

// UTF-8 text to buffer
export const text = (str) => Buffer.from(str, "utf8")

// GS h n — barcode height in dots (1–255)
export const barcodeHeight = (n) => Buffer.from([GS, 0x68, n])

// GS w n — barcode module width in dots (2–6)
export const barcodeWidth = (n) => Buffer.from([GS, 0x77, n])

// GS H n — HRI position: 0 = none, 1 = above, 2 = below, 3 = both
export const barcodeHRI = (n) => Buffer.from([GS, 0x48, n])

// GS k m n [data] — print barcode (function B)
// type: numeric code per BARCODE_TYPES map in buildBuffer
export const barcode = (type, data) => {
  const dataBytes = Buffer.from(data, "ascii")
  return Buffer.concat([Buffer.from([GS, 0x6B, type, dataBytes.length]), dataBytes])
}

// QR code — GS ( k sequence: model → module size → error correction → store → print
// ec: "l" = 7%, "m" = 15%, "q" = 25%, "h" = 30%
// size: module size in dots, 1–16
export const qrCode = (data, { size = 3, ec = "m" } = {}) => {
  const EC = { l: 48, m: 49, q: 50, h: 51 }
  const ecByte    = EC[ec] ?? EC.m
  const dataBytes = Buffer.from(data, "utf8")
  const storeLen  = dataBytes.length + 3
  const pL        = storeLen & 0xFF
  const pH        = (storeLen >> 8) & 0xFF
  return Buffer.concat([
    Buffer.from([GS, 0x28, 0x6B, 0x04, 0x00, 0x31, 0x41, 0x32, 0x00]), // model 2
    Buffer.from([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x43, size]),        // module size
    Buffer.from([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x45, ecByte]),      // error correction
    Buffer.from([GS, 0x28, 0x6B, pL, pH, 0x31, 0x50, 0x30]),            // store data
    dataBytes,
    Buffer.from([GS, 0x28, 0x6B, 0x03, 0x00, 0x31, 0x51, 0x30]),        // print
  ])
}

// GS v 0 — print raster bitmap
// pixels: Buffer of packed 1-bit data (1 = black), row-major
// widthBytes: number of bytes per row (ceil(widthDots / 8))
// heightDots: number of rows
export const rasterImage = (pixels, widthBytes, heightDots) => {
  const xL = widthBytes & 0xFF
  const xH = (widthBytes >> 8) & 0xFF
  const yL = heightDots & 0xFF
  const yH = (heightDots >> 8) & 0xFF
  const header = Buffer.from([GS, 0x76, 0x30, 0x00, xL, xH, yL, yH])
  return Buffer.concat([header, pixels])
}
