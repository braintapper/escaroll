---
paths:
  - "**/*.sql"
  - "**/*.js"
---

# Coding Style for SQL Files

## General

Put reserved SQL keywords in all caps

Separate column lists with a newline, indented below the commmand

Indent queries like the example below

One indent level is two spaces


## Note for Javascript files (*.js)

Apply the same indentation rules for multiline strings that appear to be SQL code

# Example

```sql
SELECT
  col1,
  col2
FROM
  table
  LEFT JOIN table2 ON
    table1.col1 = table2.col2
WHERE
  col1 = 'val'
  AND
  col2 = 'val2'
```
