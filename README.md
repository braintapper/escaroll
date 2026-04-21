# ESCaroll

![ESCaroll](/images/escaroll_transparent_bg.png)

Nuxt 3 ESC/POS print serverConnects to the printer via raw TCP on port 9100. Templates are YAML files on disk; a browser UI handles CRUD and test printing.

Output format is a customized variant of Markdown that makes it easier to layout content on a receipt roll. [Language Reference](/doc/markdown_for_esc.md)

Tested with the **Rongta RP332** (80mm thermal, 203dpi, 576 dots wide).

Supports images (with dithering) and text graphics via [Figlet](https://github.com/patorjk/figlet.js)

---

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Nuxt 3 / Nitro |
| UI | PrimeVue v4 (Aura dark theme) |
| Image processing | sharp (Floyd-Steinberg dithering, 1-bit raster) |
| ASCII art | figlet |
| Templates | YAML + Handlebars (body) + custom markdown |
| Transport | Raw TCP (`net.Socket`) → port 9100 |

---

## Setup

### Local development

```bash
cp .env.example .env          # set POS_POC_PRINTER_IP
npm install
npm run dev
```

Open `http://localhost:3000` for the browser UI.

### Docker

```bash
cp .env.example .env          # set POS_POC_PRINTER_IP
docker compose up -d
```

See [doc/docker.md](doc/docker.md) for full deployment instructions including volumes, printer networking, and Unraid setup.

### Environment variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POS_POC_PRINTER_IP` | `192.168.1.17` | Printer LAN IP |
| `POS_POC_TEMPLATES_PATH` | `./data/templates` | Directory for YAML template files |

---

## Print API

Both endpoints accept JSON and return `{ "success": true, "bytes": N }` on success.

---

### `POST /api/print/template`

Loads a saved YAML template, renders it with Handlebars data, and prints.

**Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `templateName` | string | yes | Filename without `.yaml` extension |
| `data` | object | no | Handlebars template data |
| `dither` | boolean | no | Floyd-Steinberg dithering for images (default `true`) |
| `threshold` | number | no | Threshold value 0–255 when dither is off (default `128`) |

**Example**

```bash
curl -X POST http://localhost:3000/api/print/template \
  -H "Content-Type: application/json" \
  -d '{
    "templateName": "daily-summary",
    "data": {
      "title": "Sales Summary",
      "items": [
        { "name": "Coffee", "qty": 2, "price": "3.50" },
        { "name": "Muffin", "qty": 1, "price": "2.75" }
      ],
      "total": "9.75",
      "note": "Cash payment received"
    }
  }'
```

---

### `POST /api/print/markdown`

Prints raw markdown directly — no template file required. Supports the full markdown dialect including date tokens.

**Body**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `header` | string | no | Markdown printed before body |
| `body` | string | no | Main content markdown |
| `footer` | string | no | Markdown printed after body |
| `tableGap` | number | no | Spaces between table columns (default `2`) |
| `dither` | boolean | no | Floyd-Steinberg dithering for images (default `true`) |
| `threshold` | number | no | Threshold value 0–255 when dither is off (default `128`) |

**Example**

```bash
curl -X POST http://localhost:3000/api/print/markdown \
  -H "Content-Type: application/json" \
  -d '{
    "header": "# My Shop\n## {date:today|%B %e, %Y}\n---",
    "body": "| Item    | Qty | Price |\n|:--------|:3:  |6:     |\n| Coffee  | 2   | 3.50  |\n| Muffin  | 1   | 2.75  |\n---\n### Total: $6.25",
    "footer": "* Printed: {date:now|%I:%M %p}"
  }'
```

---

## Template format

Templates live in `data/templates/*.yaml`.

```yaml
name: my-template
options:
  tableGap: 2
header: |
  # My Shop
  ## {date:today|%B %e, %Y}
  ---
footer: |
  ---
  * Printed: {date:now|%I:%M %p}
body: |
  ## {{title}}

  | Item | Qty | Price |
  |:----|:3:  |7:     |
  {{#each items}}| {{name}} | {{qty}} | {{price}} |
  {{/each}}
  ---
  ### Total: ${{total}}
```

- **`header` / `footer`** — markdown with date token support
- **`body`** — Handlebars template, rendered before markdown parsing
- **`options.tableGap`** — column spacing (default `2`)

### Further reading

| Document | Description |
|----------|-------------|
| [Markdown language reference](doc/markdown_for_esc.md) | Full syntax reference for the Escaroll markdown dialect |
| [Template specification](doc/document_template_spec.md) | YAML template format, render pipeline, and data object |
| [Tables](doc/grid.md) | Table syntax, column widths, alignment, and gap options |
| [Date tokens](doc/date-tokens.md) | Date/time token syntax and strftime format reference |
| [Docker deployment](doc/docker.md) | Container setup, volumes, printer networking, and Unraid |

---

## Template management API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/templates` | List all template names |
| `POST` | `/api/templates` | Create a new template |
| `GET` | `/api/templates/:name` | Get a template by name |
| `PUT` | `/api/templates/:name` | Update (or rename) a template |
| `DELETE` | `/api/templates/:name` | Delete a template |
