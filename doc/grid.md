# Tables

Tables use standard markdown pipe syntax. The separator row between the header and data rows encodes column alignment and optional fixed character widths.

## Syntax

```
| Column A  | Column B | Column C |
|:----------|:4:       |8:        |
| left      | center   | right    |
```

---

## Separator row

Each cell in the separator row controls the corresponding column:

| Separator cell | Alignment |
|----------------|-----------|
| `:----` | Left |
| `----:` | Right |
| `:----:` | Center |
| `----` | Left (default) |

A numeric value in the cell sets a **fixed character width** for that column:

| Separator cell | Effect |
|----------------|--------|
| `:4:` | Center-aligned, 4 chars wide |
| `8:` | Right-aligned, 8 chars wide |
| `:12` | Left-aligned, 12 chars wide |
| `10` | Left-aligned, 10 chars wide |

Columns without a fixed width share the remaining line width equally after fixed columns and gaps are accounted for.

---

## Column gap

The gap between columns defaults to **2 spaces**. Override it per-template via `options.tableGap` in the YAML file, or pass `tableGap` in the markdown API request body.

---

## Inline formatting

Cell content supports inline formatting (`**bold**`, `*italic*`, `_underline_`, `` `fontb` ``). Formatting markers are stripped when calculating cell widths so layout remains correct.

---

## Header row

The header row is always printed **bold**, followed by a horizontal rule. Data rows are printed in normal weight.

---

## Handlebars compatibility

Blank lines between table rows — a common side effect of Handlebars `{{#each}}` blocks — are ignored during table parsing, so generated tables render correctly without manual trimming.

```
| Item | Qty | Price |
|:----|:3:  |7:     |
{{#each items}}| {{name}} | {{qty}} | {{price}} |
{{/end}}
```
