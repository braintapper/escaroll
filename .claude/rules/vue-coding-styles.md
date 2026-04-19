---
paths:
  - "**/*.vue"
---


# Coding Style for Vue Files

The root level tag order should be:

```vue
<template/>
<script setup/>
<script>
<style scoped>
<style>
```

# Path at the top

The relative path in the folder structure should be placed in a comment in the first line of the file

For example:

```html
<!-- /app/pages/lists.vue -->
```

# Indentation

Indentation is two spaces

# Templates

Templates should always use `pug`

HTML element attributes should be separated by spaces, not commas

Make sure any commas in attribute values are preserved

If there are more than three attributes, separate each attribute with a newline and indent appropriately

Use the sass Coding style for *.pug files


# Script

Script tags are always Javascript.

Use the JS Coding style for *.js files

For refs, computed and reactive variables

* variableNameRef
* variableNameComputed
* variableNameReactive


# Styles

Style tags should always use indented sass.

Use the sass Coding style for *.sass files
