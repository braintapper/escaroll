# Date Tokens

Date tokens are resolved against the raw markdown string before parsing. They work anywhere in a template — headings, body text, table cells, footers.

## Syntax

```
{date:EXPRESSION|FORMAT}
```

- **`EXPRESSION`** — a natural language date/time phrase, parsed by [Sugar.js](https://sugarjs.com/dates/)
- **`FORMAT`** — an optional strftime format string. Defaults to `%B %e, %Y` (e.g. `April 9, 2026`)

If the expression cannot be parsed, the token is left unchanged in the output.

---

## Examples

| Token | Output |
|-------|--------|
| `{date:today}` | `April 19, 2026` |
| `{date:today\|%Y-%m-%d}` | `2026-04-19` |
| `{date:today\|%A}` | `Sunday` |
| `{date:now\|%I:%M %p}` | `02:30 PM` |
| `{date:yesterday\|%B %e}` | `April 18` |
| `{date:next Friday\|%A, %B %e}` | `Friday, April 24` |
| `{date:2 days ago\|%m/%d}` | `04/17` |
| `{date:3 hours from now\|%H:%M}` | `17:45` |

---

## strftime tokens

### Date

| Token | Meaning | Example |
|-------|---------|---------|
| `%Y` | Full year | `2026` |
| `%y` | Two-digit year | `26` |
| `%m` | Month, zero-padded | `04` |
| `%B` | Full month name | `April` |
| `%b` | Abbreviated month name | `Apr` |
| `%d` | Day, zero-padded | `09` |
| `%e` | Day, space-padded | ` 9` |
| `%A` | Full weekday name | `Sunday` |
| `%a` | Abbreviated weekday name | `Sun` |
| `%j` | Day of year | `109` |

### Time

| Token | Meaning | Example |
|-------|---------|---------|
| `%H` | Hour, 24h, zero-padded | `14` |
| `%I` | Hour, 12h, zero-padded | `02` |
| `%M` | Minutes, zero-padded | `05` |
| `%S` | Seconds, zero-padded | `09` |
| `%p` | AM/PM | `PM` |
| `%P` | am/pm | `pm` |

### Other

| Token | Meaning | Example |
|-------|---------|---------|
| `%n` | Newline | |
| `%t` | Tab | |
| `%%` | Literal `%` | `%` |
