Good question — worth thinking through before writing code. Here's my take:

**YAML** is the best fit for this use case, for a few reasons:

1. **Multiline markdown strings are first-class.** YAML's literal block (`|`) means your header/footer markdown writes exactly as you'd type it — no `\n` escaping, no quoting headings that start with `#`.

2. **Comments.** Templates benefit from documentation (what fields are expected, what the loops produce). JSON has none; YAML does.

3. **Readable data section.** The injected data for the body (line items, totals, names) reads naturally as YAML.

**JSON** would be better if templates are generated programmatically or stored in a `jsonb` DB column — but for authoring, it's painful for multiline strings.

**TOML** is excellent for config but its table/array syntax gets awkward for a mail-merge body.

---

My proposed structure — template in YAML, data injected separately as a plain JS object (from DB, API, whatever):

```yaml
# templates/daily-summary.yaml
name: daily-summary

header: |
  # My Shop
  ---
  {date:today|%A, %B %e %Y}

footer: |
  ---
  Thank you!
  * WiFi: MyShop_Guest

# Handlebars template — {{var}}, {{#each}}, {{#if}} etc.
body: |
  ## Sales Summary

  {{#each items}}
  * {{name}} x{{qty}}  ${{subtotal}}
  {{/each}}

  ---
  Total: ${{total}}

  [ ] Reviewed by manager
```

And the injected data:
```json
{
  "items": [
    { "name": "Coffee",  "qty": 2, "subtotal": "7.00" },
    { "name": "Muffin",  "qty": 1, "subtotal": "3.50" }
  ],
  "total": "10.50"
}
```

**For the body templating** I'd suggest [Handlebars](https://handlebarsjs.com/) — it's a superset of Mustache, gives you `{{#each}}` for line items and `{{#if}}` for conditionals, and is well-understood. The render step would be: load YAML → render body with Handlebars + data → run `substitute()` for date tokens → parse markdown → print.

Does that structure match what you had in mind, or do you want to adjust the body template language or the header/footer approach?
