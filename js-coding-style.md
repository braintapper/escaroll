---
paths:
  - "**/*.vue"
---

# Javascript Coding Rules

# Path at the top

The relative path in the folder structure should be placed in a comment in the first line of the file

For example:

```javascript
// /server/api/lists/index.get.js
```

# Indentation

Indentation is two spaces

## Variable and Function Naming

Variables and functions should be camelcase with the first letter lowercase.

Object attributes are an exception. Attributes and methods should be lower snake case.


## For functions in objects

Prefer anonymous functions. Example

```javascript
{
  method_name: (param) => {
    return param
  }
}
```

## Literals

For Javascript quoted strings, always use `"` for outer quotes and only use `'` when inside a quote


## Line endings

Do not use semi-colons


## Multiline strings in backticks

Indent the multiline strings so that they are in line with the rest of the code's indentation.

For strings that look like SQL, indent them additionally as you would indent sql.


## SQL Statements in variables

`sql-template-strings` is the npm that is primarily used for non-hard-coded SQL statements.

Where Javascript variables are used in an sql statement ensure that the sqt function is used.
