// /server/utils/parseMarkdown.js

// Parse a markdown string into a list of print descriptors.
// Supported syntax:
//   # Heading           → h1 (centered by default, bold, 2× wide + 2× tall)
//   ## Heading          → h2 (centered by default, bold, 2× wide)
//   ### Heading         → h3 (left by default, bold, normal size)
//   #< ##> ###<         → heading with explicit alignment (< left, > right)
//   ---                 → horizontal rule
//   * item              → bullet, wraps with 4-space continuation indent
//   [ ] task            → unchecked checkbox, wraps same
//   [x] task            → checked checkbox, wraps same
//   *text*              → inline bold span
//   ![](path)           → image, centered, full width
//   ![< w=80% h=50% dither=false](path)  → image options
//   {date:expr|fmt}     → date token (resolved by substitute() before parsing)
//   | Col | Col |       → table; separator row encodes alignment and optional width
//   |:----|:--:|------:| → colons = alignment, number = fixed char width
//   ``` (fenced block)  → render enclosed content in Font B (narrow, 64 chars/line)
//   blank line          → line feed

// opts:
//   tableGap  number   spaces between table columns (default 2)

// ── Constants ────────────────────────────────────────────────────────────────

const CHARS_FONT_A = 48   // Font A: 576 dots / 12 dots per char (default)
const CHARS_FONT_B = 64   // Font B: 576 dots / 9 dots per char (narrow)

const ALIGN = { "<": 0, ">": 2 }
const CONTINUATION = "    "

// ── Helpers ──────────────────────────────────────────────────────────────────

// Strip inline format markers (**bold**, *italic*, _underline_, `fontb`) for width calculations.
const stripInlineMarkers = (s) => s
  .replace(/\*\*([^*]+)\*\*/g, "$1")
  .replace(/`([^`]+)`/g, "$1")
  .replace(/\*([^*]+)\*/g, "$1")
  .replace(/_([^_]+)_/g, "$1")

const wrapWithPrefix = (prefix, content, base, charsPerLine) => {
  const maxWidth = charsPerLine - prefix.length
  const words    = content.split(" ")
  const chunks   = []
  let current        = ""
  let currentVisible = ""
  let isFirst        = true

  for (const word of words) {
    const wordVisible = stripInlineMarkers(word)
    if (current === "") {
      current        = word
      currentVisible = wordVisible
    } else if ((currentVisible + " " + wordVisible).length <= maxWidth) {
      current        += " " + word
      currentVisible += " " + wordVisible
    } else {
      chunks.push((isFirst ? prefix : CONTINUATION) + current)
      isFirst        = false
      current        = word
      currentVisible = wordVisible
    }
  }
  chunks.push((isFirst ? prefix : CONTINUATION) + current)

  return chunks.map(c => ({ ...base, content: c }))
}

// ── Image alt parser ─────────────────────────────────────────────────────────

const parseImageAlt = (alt) => {
  const tokens = alt.trim().split(/\s+/).filter(Boolean)
  let align  = 1
  let wPct   = 100
  let hPct   = 100
  let dither = null

  for (const token of tokens) {
    if (token === "<") { align = 0; continue }
    if (token === ">") { align = 2; continue }
    const wMatch = token.match(/^w=(\d+)%$/)
    if (wMatch) { wPct = Math.min(100, parseInt(wMatch[1])); continue }
    const hMatch = token.match(/^h=(\d+)%$/)
    if (hMatch) { hPct = parseInt(hMatch[1]); continue }
    if (token === "dither=true")  { dither = true;  continue }
    if (token === "dither=false") { dither = false; continue }
  }

  return { align, wPct, hPct, dither }
}

// ── Heading parser ───────────────────────────────────────────────────────────

const HEADING_RE          = /^(#{1,3})([<>])? (.+)$/
const headingSizes        = { 1: [2, 2], 2: [2, 1], 3: [1, 1] }
const headingDefaultAlign = { 1: 1, 2: 1, 3: 0 }

// ── Table parser ─────────────────────────────────────────────────────────────

const splitTableRow = (line) =>
  line.split("|").slice(1, -1).map(c => c.trim())

const parseColumnSpec = (cell) => {
  const s     = cell.trim()
  const left  = s.startsWith(":")
  const right = s.endsWith(":")
  const align = (left && right) ? 1 : right ? 2 : 0
  const inner = s.replace(/^:/, "").replace(/:$/, "")
  const width = /^\d+$/.test(inner) ? parseInt(inner) : null
  return { align, width }
}

const padCell = (raw, col) => {
  const visible = stripInlineMarkers(raw)
  const pad     = Math.max(0, col.width - visible.length)
  if (col.align === 2) return " ".repeat(pad) + raw
  if (col.align === 1) {
    const left  = Math.floor(pad / 2)
    return " ".repeat(left) + raw + " ".repeat(pad - left)
  }
  return raw + " ".repeat(pad)
}

const parseTableBlock = (lines, tableGap, charsPerLine) => {
  if (lines.length < 2) {
    return lines.map(line => ({ type: "text", content: line, align: 0, bold: false, size: [1, 1] }))
  }

  const headerCells = splitTableRow(lines[0])
  const specCells   = splitTableRow(lines[1])
  const dataRows    = lines.slice(2).map(splitTableRow)
  const rawCols     = specCells.map(parseColumnSpec)

  const totalGap = tableGap * (rawCols.length - 1)
  const fixed    = rawCols.reduce((sum, c) => sum + (c.width ?? 0), 0)
  const autoN    = rawCols.filter(c => c.width === null).length
  const autoW    = autoN > 0 ? Math.floor((charsPerLine - totalGap - fixed) / autoN) : 0
  const cols     = rawCols.map(c => ({ align: c.align, width: c.width ?? autoW }))

  const gap       = " ".repeat(tableGap)
  const formatRow = (cells) => cols.map((col, i) => padCell(cells[i] ?? "", col)).join(gap)

  return [
    { type: "text", content: formatRow(headerCells), align: 0, bold: true,  size: [1, 1] },
    { type: "hr" },
    ...dataRows.map(cells => ({ type: "text", content: formatRow(cells), align: 0, bold: false, size: [1, 1] })),
  ]
}

// ── Single-line parser ───────────────────────────────────────────────────────

const parseLine = (line, base, charsPerLine) => {
  if (line.trim() === "") return [{ type: "lf" }]

  const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/)
  if (imgMatch) {
    const { align, wPct, hPct, dither } = parseImageAlt(imgMatch[1])
    return [{ type: "image", path: imgMatch[2].trim(), align, wPct, hPct, dither }]
  }

  if (/^---+$/.test(line.trim())) return [{ type: "hr" }]
  if (/^___+$/.test(line.trim())) return [{ type: "hr", char: "_" }]

  const headingMatch = line.match(HEADING_RE)
  if (headingMatch) {
    const level     = headingMatch[1].length
    const alignChar = headingMatch[2]
    return [{
      type:    "text",
      content: headingMatch[3].trim(),
      align:   alignChar !== undefined ? ALIGN[alignChar] : headingDefaultAlign[level],
      bold:    true,
      size:    headingSizes[level],
    }]
  }

  if (line.startsWith("* "))   return wrapWithPrefix(" *  ", line.slice(2), base, charsPerLine)
  if (/^\[x\] /i.test(line))  return wrapWithPrefix("[x] ", line.slice(4), base, charsPerLine)
  if (line.startsWith("[ ] ")) return wrapWithPrefix("[ ] ", line.slice(4), base, charsPerLine)

  return [{ ...base, content: line }]
}

// ── Figlet modifier parser ────────────────────────────────────────────────────

const FIGLET_LAYOUTS = new Set(["default", "full", "fitted", "smushing", "universal"])

const parseFigletModifier = (modifier) => {
  const tokens    = modifier.split(/\s+/).filter(Boolean)
  let fontb       = false
  let figletFont  = "Standard"
  let hLayout     = "default"
  let vLayout     = "default"

  for (const token of tokens) {
    if (token === "b") { fontb = true; continue }
    const fontMatch = token.match(/^font=(.+)$/)
    if (fontMatch) { figletFont = fontMatch[1]; continue }
    const hMatch = token.match(/^h=(.+)$/)
    if (hMatch && FIGLET_LAYOUTS.has(hMatch[1])) { hLayout = hMatch[1]; continue }
    const vMatch = token.match(/^v=(.+)$/)
    if (vMatch && FIGLET_LAYOUTS.has(vMatch[1])) { vLayout = vMatch[1]; continue }
  }

  return { fontb, figletFont, hLayout, vLayout }
}

// ── Barcode modifier parser ───────────────────────────────────────────────────

const BARCODE_ALIGN = { left: 0, center: 1, right: 2 }
const BARCODE_HRI   = { none: 0, above: 1, below: 2, both: 3 }

const parseBarcodeModifier = (modifier) => {
  const tokens  = modifier.split(/\s+/).filter(Boolean)
  let bAlign    = 1
  let bType     = "code128"
  let bHeight   = 80
  let bWidth    = 3
  let bHRI      = 2

  for (const token of tokens) {
    if (BARCODE_ALIGN[token] !== undefined) { bAlign = BARCODE_ALIGN[token]; continue }
    const typeMatch = token.match(/^type=(.+)$/)
    if (typeMatch) { bType = typeMatch[1].toLowerCase(); continue }
    const hPctMatch = token.match(/^h=(\d+)%$/)
    if (hPctMatch) { bHeight = Math.max(1, Math.min(255, Math.round(255 * parseInt(hPctMatch[1]) / 100))); continue }
    const hMatch = token.match(/^h=(\d+)$/)
    if (hMatch) { bHeight = Math.max(1, Math.min(255, parseInt(hMatch[1]))); continue }
    const wPctMatch = token.match(/^w=(\d+)%$/)
    if (wPctMatch) { bWidth = Math.max(2, Math.min(6, Math.round(2 + 4 * parseInt(wPctMatch[1]) / 100))); continue }
    const wMatch = token.match(/^w=([2-6])$/)
    if (wMatch) { bWidth = parseInt(wMatch[1]); continue }
    if (BARCODE_HRI[token] !== undefined) { bHRI = BARCODE_HRI[token]; continue }
  }

  return { bAlign, bType, bHeight, bWidth, bHRI }
}

// ── QR modifier parser ────────────────────────────────────────────────────────

const QR_ALIGN = { left: 0, center: 1, right: 2 }
const QR_EC    = new Set(["l", "m", "q", "h"])

const parseQRModifier = (modifier) => {
  const tokens = modifier.split(/\s+/).filter(Boolean)
  let qAlign   = 1
  let qSize    = 3
  let qEC      = "m"

  for (const token of tokens) {
    if (QR_ALIGN[token] !== undefined) { qAlign = QR_ALIGN[token]; continue }
    const wPctMatch = token.match(/^w=(\d+)%$/)
    if (wPctMatch) { qSize = Math.max(1, Math.min(16, Math.round(16 * parseInt(wPctMatch[1]) / 100))); continue }
    const sizeMatch = token.match(/^size=(\d+)$/)
    if (sizeMatch) { qSize = Math.min(16, Math.max(1, parseInt(sizeMatch[1]))); continue }
    const ecMatch = token.match(/^ec=([lmqh])$/)
    if (ecMatch && QR_EC.has(ecMatch[1])) { qEC = ecMatch[1]; continue }
  }

  return { qAlign, qSize, qEC }
}

// ── Main line-array processor (called recursively for Font B blocks) ─────────

const parseLines = (lines, opts) => {
  const { tableGap = 2, charsPerLine = CHARS_FONT_A } = opts
  const base   = { type: "text", align: 0, bold: false, size: [1, 1] }
  const result = []
  let i = 0

  while (i < lines.length) {
    // Figlet block → ASCII art, optional Font B / font name / layout
    if (lines[i].trim().startsWith("```figlet")) {
      const figletOpts = parseFigletModifier(lines[i].trim().slice(9).trim())
      const block      = []
      i++ // skip opening fence
      while (i < lines.length && lines[i].trim() !== "```") {
        block.push(lines[i++])
      }
      i++ // skip closing fence
      result.push({ type: "figlet", content: block.join("\n").trim(), ...figletOpts })

    // QR code block
    } else if (lines[i].trim().startsWith("```qr")) {
      const qrOpts = parseQRModifier(lines[i].trim().slice(5).trim())
      const block  = []
      i++ // skip opening fence
      while (i < lines.length && lines[i].trim() !== "```") {
        block.push(lines[i++])
      }
      i++ // skip closing fence
      result.push({ type: "qr", data: block.join("").trim(), ...qrOpts })

    // Barcode block
    } else if (lines[i].trim().startsWith("```barcode")) {
      const barcodeOpts = parseBarcodeModifier(lines[i].trim().slice(10).trim())
      const block       = []
      i++ // skip opening fence
      while (i < lines.length && lines[i].trim() !== "```") {
        block.push(lines[i++])
      }
      i++ // skip closing fence
      result.push({ type: "barcode", data: block.join("").trim(), ...barcodeOpts })

    // Fenced block → Font B
    } else if (lines[i].trim() === "```") {
      const block = []
      i++ // skip opening fence
      while (i < lines.length && lines[i].trim() !== "```") {
        block.push(lines[i++])
      }
      i++ // skip closing fence
      result.push(
        { type: "font", value: 1 },
        ...parseLines(block, { ...opts, charsPerLine: CHARS_FONT_B }),
        { type: "font", value: 0 },
      )

    // Table block
    } else if (lines[i].startsWith("|")) {
      const block = []
      while (i < lines.length) {
        if (lines[i].startsWith("|")) {
          block.push(lines[i++])
        } else if (lines[i].trim() === "" && lines[i + 1]?.startsWith("|")) {
          i++ // skip blank lines between Handlebars-generated table rows
        } else {
          break
        }
      }
      result.push(...parseTableBlock(block, tableGap, charsPerLine))

    // Normal line
    } else {
      result.push(...parseLine(lines[i], base, charsPerLine))
      i++
    }
  }

  return result
}

// ── Export ───────────────────────────────────────────────────────────────────

export const parseMarkdown = (md, opts = {}) => {
  if (!md?.trim()) return []
  return parseLines(md.split("\n"), opts)
}
