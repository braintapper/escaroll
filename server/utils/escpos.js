// /server/utils/escpos.js

const ESC = 0x1B
const GS  = 0x1D
const LF  = 0x0A

// Printer initialization — clears settings, resets to defaults
export const INIT = Buffer.from([ESC, 0x40])

export const LF_CMD = Buffer.from([LF])

// Partial cut with small paper feed
export const CUT = Buffer.from([GS, 0x56, 0x41, 0x03])

// Alignment: 0 = left, 1 = center, 2 = right
export const align = (mode) => Buffer.from([ESC, 0x61, mode])

// Text emphasis
export const bold = (on) => Buffer.from([ESC, 0x45, on ? 1 : 0])

// Character size multiplier — width and height each 1–8
export const textSize = (width, height) => {
  const byte = ((width - 1) << 4) | (height - 1)
  return Buffer.from([GS, 0x21, byte])
}

// UTF-8 text to buffer
export const text = (str) => Buffer.from(str, "utf8")

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
