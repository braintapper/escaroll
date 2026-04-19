# Markdown for ESC/POS

Custom markdown dialect parsed by `server/utils/parseMarkdown.js` and rendered to ESC/POS buffers by `server/utils/buildBuffer.js`. Designed for the Rongta RP332 (80mm, 203dpi, 576 dots wide).

---

## Printer constants

| Font | Dots/char | Chars/line |
|------|-----------|------------|
| Font A (default) | 12 | 48 |
| Font B (narrow)  | 9  | 64 |

---

## Headings

```
# Heading       → h1: centered, bold, 2× wide + 2× tall
## Heading      → h2: centered, bold, 2× wide
### Heading     → h3: left, bold, normal size
```

Override alignment by placing `<` (left) or `>` (right) immediately after the `#` markers:

```
#< Left h1
#> Right h1
##> Right h2
###> Right h3
```

---

## Horizontal rules

```
---    → 48 hyphens
___    → 48 underscores + trailing line feed
```

---

## Lists

```
* item          → bullet, indented as " *  "
[ ] task        → unchecked checkbox
[x] task        → checked checkbox
```

Long lines wrap automatically. Continuation lines are indented 4 spaces to align with the content column.

---

## Inline formatting

| Syntax | Effect |
|--------|--------|
| `**text**` | Bold |
| `*text*` | Italic (printer-dependent) |
| `_text_` | Underline (single) |
| `` `text` `` | Inline Font B (narrow) |

Inline formats can appear in any body text line, bullet, or checkbox.

---

## Images

```
![](path)
![< w=80% h=50% dither=false](path)
```

| Option | Values | Default |
|--------|--------|---------|
| Alignment | `<` (left), `>` (right), omit (center) | center |
| `w=N%` | % of printer width (576 dots) | 100% |
| `h=N%` | % of natural height | 100% |
| `dither=` | `true` / `false` | document-level setting |

Path is an absolute filesystem path. When `h=` differs from 100%, the image is resized with `fit: fill`. Dithering uses Floyd-Steinberg error diffusion; `dither=false` uses a simple threshold instead.

---

## Font B block

Switches to Font B (64 chars/line) for the enclosed content, then restores Font A. Tables and word-wrap inside the block use the narrower column width.

````
```
narrow text here
```
````

---

## Figlet (ASCII art)

````
```figlet [b] [font=Standard] [h=default] [v=default]
Text
```
````

| Option | Values | Default |
|--------|--------|---------|
| `b` | flag — render in Font B | Font A |
| `font=` | Any figlet font name (`Standard`, `Slant`, `Banner`, `Big`, `Small`, `Shadow`, `Doom`, …) | `Standard` |
| `h=` | `default`, `full`, `fitted`, `smushing`, `universal` | `default` |
| `v=` | `default`, `full`, `fitted`, `smushing`, `universal` | `default` |

`h` and `v` control figlet's horizontal/vertical character layout (spacing and smushing).

---

## Barcodes (1D)

````
```barcode [left|center|right] [type=code128] [h=80] [w=3] [none|above|below|both]
DATA
```
````

| Option | Values | Default |
|--------|--------|---------|
| Alignment | `left`, `center`, `right` | `center` |
| `type=` | `code128`, `code39`, `ean13`, `ean8`, `upca`, `upce`, `itf`, `codabar`, `code93` | `code128` |
| `h=N` | Barcode height in dots, 1–255 | `80` |
| `h=N%` | Height as % of 255 dots | — |
| `w=N` | Module width in dots, 2–6 | `3` |
| `w=N%` | Module width as % of range 2–6 | — |
| HRI position | `none`, `above`, `below`, `both` | `below` |

HRI = Human Readable Interpretation (the text printed near the barcode).

---

## QR codes

````
```qr [left|center|right] [size=3] [w=N%] [ec=m]
DATA
```
````

| Option | Values | Default |
|--------|--------|---------|
| Alignment | `left`, `center`, `right` | `center` |
| `size=N` | Module size in dots, 1–16 | `3` |
| `w=N%` | Module size as % of range 1–16 | — |
| `ec=` | `l` (7%), `m` (15%), `q` (25%), `h` (30%) | `m` |

`size=` and `w=N%` both set the module size; use whichever is more convenient. Height is ignored — QR codes are always square. Higher error correction (`ec=h`) makes the code more fault-tolerant but physically larger.

---

## Tables

Uses standard markdown pipe syntax. The separator row encodes column alignment and optional fixed width.

```
| Item   | Qty | Price |
|:-------|:3:  |7:     |
| Apple  | 2   | 1.50  |
```

Separator cell format: `:` on left = left-align, `:` on right = right-align, both = center. A numeric value in the cell sets a fixed character width. Columns without a fixed width share the remaining space equally.

The `tableGap` option (default `2`) controls spaces between columns. Set it in the template YAML under `options.tableGap`.

---

## Date tokens

Resolved before markdown parsing. Accepts Sugar.js natural language expressions and strftime format strings.

```
{date:today|%A}           → Monday
{date:today|%B %e, %Y}    → April 19, 2026
{date:now|%I:%M %p}       → 02:30 PM
{date:last friday|%Y-%m-%d}
```

Format: `{date:EXPRESSION|FORMAT}`. The format is optional; default is `%B %e, %Y`.

---

## Blank lines

A blank line emits a line feed (moves paper down one line). Blank lines are preserved as-is to give WYSIWYG spacing control.

---

## Template structure (YAML)

Templates live in `data/templates/*.yaml`. The `body` section is a Handlebars template; `header` and `footer` are plain markdown (with date token support).

```yaml
name: my-template
options:
  tableGap: 2
header: |
  # My Shop
footer: |
  * Printed: {date:now|%I:%M %p}
body: |
  ## {{title}}
  | Item | Qty |
  |:----|:4:  |
  {{#each items}}| {{name}} | {{qty}} |
  {{/each}}
```
