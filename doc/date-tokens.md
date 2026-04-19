Good plan. I'll use `sugar-date` for the natural language parsing and implement strftime myself (it's only ~20 tokens and avoids an extra dependency). The token syntax will be `{date:EXPRESSION|FORMAT}` — e.g. `{date:today|%B %d, %Y}` or `{date:next Friday}`. Substitution runs on the raw markdown strings before parsing, so tokens work anywhere — headings, body text, plain lines.

Now wire it into the markdown endpoint before the sections are parsed:

Update the UI hint to mention token syntax:

Done. Some examples of what you can now write anywhere in the markdown:

| Token | Output (today = April 19 2026) |
|---|---|
| `{date:today}` | `April 19, 2026` |
| `{date:today\|%Y-%m-%d}` | `2026-04-19` |
| `{date:today\|%A}` | `Sunday` |
| `{date:yesterday\|%B %e}` | `April 18` |
| `{date:next Friday\|%A, %B %e}` | `Friday, April 24` |
| `{date:2 days ago\|%m/%d}` | `04/17` |

If Sugar can't parse the expression the token is left as-is, so typos won't silently print garbage. The default format (`%B %e, %Y`) uses `%e` (space-padded day) rather than `%d` so you get `April  9` instead of `April 09`.


Yes — the strftime implementation in [`server/utils/substitute.js`](server/utils/substitute.js) covers the time tokens:

| Token | Meaning | Example |
|---|---|---|
| `%H` | Hour, 24h, zero-padded | `14` |
| `%I` | Hour, 12h, zero-padded | `02` |
| `%M` | Minutes | `05` |
| `%S` | Seconds | `09` |
| `%p` | AM/PM | `PM` |
| `%P` | am/pm | `pm` |

So `{date:today|%I:%M %p}` or `{date:now|%H:%M}` both work. Sugar also parses time expressions, so things like `{date:3 hours from now|%H:%M}` should resolve correctly too.
