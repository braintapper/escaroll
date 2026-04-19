# POS-POC

**Project: Nuxt-based ESC/POS print server**

**Printer:** Rongta RP332 (80mm thermal, 203dpi, 576 dots wide, 72mm print width)
- Connects via raw TCP on **port 9100** over LAN
- Fully supports graphics (bitmap download, variable density) and text via ESC/POS

**Deployment:** Docker container on Unraid, bridged networking to reach printer IP

**Stack:**
- **Nuxt/Nitro** — API routes handle print jobs (`POST /api/print`)
- **node-escpos + escpos-network** — ESC/POS command building + TCP transport
- **sharp** — image processing/dithering (native binaries fine on Linux container)
- **resvg-js** — SVG rasterization if needed
- **node-cron** — scheduled print jobs via Nitro plugin
- **PostgreSQL** — templates (jsonb), schedules, dynamic data

**Templates:** JSON stored in `jsonb` PG column. Structure separates fixed layout from dynamic data (e.g. fixed header/footer, dynamic line items with loop construct).

**Images:** Volume mount at `ASSETS_PATH=/data`
- `/data/images/source/` — master SVGs or high-res PNGs
- `/data/images/cache/` — pre-processed 1-bit bitmaps
- Prefer SVG source → rasterize at render time (or cache result)
- PNG for working format, avoid JPEG

**Scheduled jobs:** `node-cron` registered at startup from `print_schedules` PG table:
```sql
CREATE TABLE print_schedules (
  id            serial PRIMARY KEY,
  name          text NOT NULL,
  cron_expr     text NOT NULL,
  template_name text NOT NULL,
  data_query    text,
  enabled       boolean DEFAULT true,
  last_run_at   timestamptz,
  created_at    timestamptz DEFAULT now()
);
```
- Set `TZ=America/Toronto` in container env
- Manageable via Nuxt UI without container restart

**Immediate next step:** POC — raw TCP connection to printer, send a test ESC/POS buffer, confirm LAN printing works before building the template layer.
