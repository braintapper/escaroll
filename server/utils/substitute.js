// /server/utils/substitute.js
import Sugar from "sugar-date"

// --- strftime implementation ---
// Covers the tokens most useful for receipt printing.

const pad   = (n, w = 2) => String(n).padStart(w, "0")
const space = (n)        => String(n).padStart(2, " ")

const MONTHS_LONG  = ["January","February","March","April","May","June","July","August","September","October","November","December"]
const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
const DAYS_LONG    = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"]
const DAYS_SHORT   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"]

const strftime = (fmt, date) =>
  fmt.replace(/%([A-Za-z%])/g, (_, t) => {
    switch (t) {
      case "Y": return date.getFullYear()
      case "y": return pad(date.getFullYear() % 100)
      case "m": return pad(date.getMonth() + 1)
      case "d": return pad(date.getDate())
      case "e": return space(date.getDate())
      case "H": return pad(date.getHours())
      case "I": return pad(date.getHours() % 12 || 12)
      case "M": return pad(date.getMinutes())
      case "S": return pad(date.getSeconds())
      case "p": return date.getHours() < 12 ? "AM" : "PM"
      case "P": return date.getHours() < 12 ? "am" : "pm"
      case "A": return DAYS_LONG[date.getDay()]
      case "a": return DAYS_SHORT[date.getDay()]
      case "B": return MONTHS_LONG[date.getMonth()]
      case "b": return MONTHS_SHORT[date.getMonth()]
      case "j": {
        const start = new Date(date.getFullYear(), 0, 0)
        return pad(Math.floor((date - start) / 86_400_000), 3)
      }
      case "n": return "\n"
      case "t": return "\t"
      case "%": return "%"
      default:  return "%" + t
    }
  })

// --- token substitution ---

const DEFAULT_DATE_FORMAT = "%B %e, %Y"

// Matches {date:EXPRESSION} or {date:EXPRESSION|FORMAT}
const DATE_TOKEN_RE = /\{date:([^|}]+?)(?:\|([^}]+))?\}/g

export const substitute = (text) => {
  if (!text) return text

  return text.replace(DATE_TOKEN_RE, (match, expression, format) => {
    try {
      const date = Sugar.Date.create(expression.trim())
      // Sugar returns an invalid Date for unrecognised expressions
      if (isNaN(date.getTime())) return match
      return strftime((format ?? DEFAULT_DATE_FORMAT).trim(), date)
    } catch {
      return match
    }
  })
}
