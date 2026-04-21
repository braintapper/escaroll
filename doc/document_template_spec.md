# Template Specification

Templates are YAML files stored in the `data/templates/` directory. Each file defines a reusable print layout with a static header and footer and a dynamic Handlebars body.

---

## File format

```yaml
name: my-template
options:
  tableGap: 2
header: |
  # My Shop
  ## {date:today|%A, %B %e %Y}
  ---
footer: |
  ---
  * Printed: {date:now|%I:%M %p}
body: |
  ## {{title}}

  | Item | Qty | Price |
  |:----|:3:  |7:     |
  {{#each items}}| {{name}} | {{qty}} | ${{price}} |
  {{/each}}
  ---
  ### Total: ${{total}}

  {{#if note}}
  {{note}}
  {{/if}}
```

---

## Sections

### `header` and `footer`

Static markdown rendered at the top and bottom of every print job. Support [date tokens](date-tokens.md) but not Handlebars expressions.

### `body`

A [Handlebars](https://handlebarsjs.com/) template rendered against the supplied data object before markdown parsing. Supports the full Handlebars feature set including `{{#each}}`, `{{#if}}`, and `{{#with}}`. After Handlebars rendering, the result is parsed as Escaroll markdown.

### `options`

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `tableGap` | number | `2` | Spaces between table columns |

---

## Render pipeline

```
Load YAML → Render body with Handlebars + data → substitute() date tokens → Parse markdown → Build ESC/POS buffer → Send to printer
```

Date token substitution runs on all three sections (`header`, `body`, `footer`) after Handlebars rendering.

---

## Data object

The data object is supplied at print time via the `POST /api/print/template` endpoint. It can be any JSON-serialisable object and is passed directly to Handlebars as the template context.

```json
{
  "title": "Sales Summary",
  "items": [
    { "name": "Coffee", "qty": 2, "price": "3.50" },
    { "name": "Muffin", "qty": 1, "price": "2.75" }
  ],
  "total": "6.25",
  "note": "Cash payment received"
}
```

---

## File naming

Template filenames must be alphanumeric and may contain hyphens and underscores (`[\w-]+`). The `.yaml` extension is added automatically. The `name` field inside the file should match the filename.

---

## Format choice rationale

YAML was chosen over JSON and TOML for template storage because:

- **Multiline strings are first-class.** YAML literal blocks (`|`) allow markdown to be written exactly as it appears — no `\n` escaping, no quoting of `#` headings.
- **Comments are supported.** Templates can document their expected data fields inline.
- **Readable structure.** The header/body/footer separation is clear and easy to edit by hand.
