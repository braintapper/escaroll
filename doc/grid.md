Good additions. Here's what I'll implement:

- **Tables**: parse the standard `|col|col|` syntax; separator row encodes alignment (`:`) and optional width (number instead of dashes); auto-distribute remaining width among unsized columns; configurable gap via `tableGap` option in the template YAML
- **`*text*` inline bold**: handled in `buildBuffer` as inline segments, width-stripped when calculating wrap/pad widths
- Header row prints bold, followed by HR

A few things to figure out first — let me read the current state of the files I'm changing:

Now I have the full picture. Writing the rewrite:

Now update `buildBuffer.js` to handle inline `*bold*` spans on non-bold descriptors:

Now wire `options` through the template stack:

Also accept `tableGap` from the body in the raw markdown endpoint:

Update the sample template to demonstrate tables and inline bold:

Finally update the UI hint:

Done. Summary of what landed:

**Tables** — separator row encodes both alignment and width:
```
| Item           | Qty | Price  |
|:--------------|:3:|7:|        ← left/auto, center/3, right/7
| Coffee         |  2  |  $7.00 |
```
Auto-width columns split whatever's left after fixed columns and gaps. Blank lines between rows (from Handlebars `{{#each}}`) are skipped so tables survive templating.

**Inline bold** `*text*` — works in any non-bold line including table cells. Width/padding calculations strip the markers so layout is correct.

**`tableGap`** — set in the template YAML under `options.tableGap`, or pass it directly in the raw markdown API body. Default is 2.
