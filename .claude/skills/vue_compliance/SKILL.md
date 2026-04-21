---
name: vue_compliance
description: "Reorganizes Vue files to be consistent Usage: /vue_compliance"
model: sonnet
---

When running this skill, scan through all Vue components (files with the .vue extension) to ensure that the root elements are organized like this:

1) The first line of the template should be an HTML comment that is the relative path inside the solution. e.g. `<!-- /app/components/Virtual/List.vue -->`
2) <template> tags appears first
3) <script> tags appear next
4) <style> tages appear last
