<!-- /pages/index.vue -->
<template lang="pug">
.container
  h1 ESC/POS Print Tester

  //- Test print
  section
    h2 Test Page
    button(:disabled="loadingRef" @click="testPrint") Print Test Page

  //- Markdown print
  section
    h2 Print Markdown
    p.hint Supports: # h1 &nbsp;|&nbsp; * bullet &nbsp;|&nbsp; [ ] checkbox &nbsp;|&nbsp; [x] checkbox
    textarea(v-model="markdownRef" rows="8" placeholder="# My Heading\n* Bullet item\n[ ] Unchecked task\n[x] Done task\nPlain text line")
    .actions
      button(:disabled="loadingRef || !markdownRef.trim()" @click="printMarkdown") Print Markdown

  //- Line-builder print
  section
    h2 Print Text
    p.hint One line per entry. Use the controls to set alignment, size, and bold.
    .line-row(v-for="(line, i) in textLinesRef" :key="i")
      input(v-model="line.content" placeholder="Line text" class="line-input")
      select(v-model="line.align")
        option(:value="0") Left
        option(:value="1") Center
        option(:value="2") Right
      label
        input(v-model="line.bold" type="checkbox")
        |  Bold
      label
        | Size&nbsp;
        input(v-model.number="line.size[0]" type="number" min="1" max="8" class="size-input")
        | &nbsp;×&nbsp;
        input(v-model.number="line.size[1]" type="number" min="1" max="8" class="size-input")
      button(@click="textLinesRef.splice(i, 1)") ✕
    .actions
      button(@click="addLine") + Add Line
      button(:disabled="loadingRef || textLinesRef.length === 0" @click="printText") Print

  //- Image print
  section
    h2 Print Image
    p.hint Provide an absolute path to a PNG or SVG on the server.
    .image-row
      input(v-model="imagePathRef" placeholder="/data/images/source/logo.png" class="path-input")
      label
        input(v-model="ditherRef" type="checkbox")
        |  Dither
      label(v-if="!ditherRef")
        | Threshold&nbsp;
        input(v-model.number="thresholdRef" type="number" min="0" max="255" class="size-input")
    .actions
      button(:disabled="loadingRef || !imagePathRef" @click="printImage") Print Image

  //- Response
  section(v-if="responseRef")
    h2 Response
    pre.response {{ JSON.stringify(responseRef, null, 2) }}

  p.error(v-if="errorRef") {{ errorRef }}
</template>

<script setup>
const loadingRef = ref(false)
const responseRef = ref(null)
const errorRef = ref(null)

const markdownRef = ref("# Hello World\n* Bullet item\n[ ] Unchecked task\n[x] Done task\nPlain line")

const textLinesRef = ref([
  { content: "Hello, world!", align: 1, bold: true, size: [2, 2] },
  { content: "Normal text line", align: 0, bold: false, size: [1, 1] },
])

const imagePathRef = ref("")
const thresholdRef = ref(128)
const ditherRef    = ref(false)

const call = async (url, body) => {
  loadingRef.value = true
  errorRef.value = null
  responseRef.value = null
  try {
    responseRef.value = await $fetch(url, { method: "POST", body })
  } catch (e) {
    errorRef.value = e?.data?.message ?? e.message
  } finally {
    loadingRef.value = false
  }
}

// Parse a small subset of markdown into ESC/POS line descriptors.
// Supported: # h1, * bullet, [ ] checkbox, [x] checked checkbox, plain text.
const parseMarkdown = (md) => {
  return md.split("\n")
    .filter(line => line.trim() !== "")
    .map(line => {
      if (line.startsWith("# ")) {
        return { content: line.slice(2).trim(), align: 1, bold: true, size: [2, 1] }
      }
      if (line.startsWith("* ")) {
        return { content: "* " + line.slice(2), align: 0, bold: false, size: [1, 1] }
      }
      if (/^\[x\] /i.test(line)) {
        return { content: "[x] " + line.slice(4), align: 0, bold: false, size: [1, 1] }
      }
      if (line.startsWith("[ ] ")) {
        return { content: "[ ] " + line.slice(4), align: 0, bold: false, size: [1, 1] }
      }
      return { content: line, align: 0, bold: false, size: [1, 1] }
    })
}

const testPrint    = () => call("/api/print/test")
const printMarkdown = () => call("/api/print/text", { lines: parseMarkdown(markdownRef.value) })
const addLine       = () => { textLinesRef.value.push({ content: "", align: 0, bold: false, size: [1, 1] }) }
const printText     = () => call("/api/print/text", { lines: textLinesRef.value })
const printImage    = () => call("/api/print/image", { imagePath: imagePathRef.value, dither: ditherRef.value, threshold: thresholdRef.value })
</script>

<style lang="sass">
*, *::before, *::after
  box-sizing: border-box

body
  font-family: system-ui, sans-serif
  background: #111
  color: #eee
  margin: 0
  padding: 1rem

.container
  max-width: 700px
  margin: 0 auto

h1
  margin-bottom: 1.5rem

h2
  margin: 0 0 0.5rem

section
  background: #1e1e1e
  border: 1px solid #333
  border-radius: 8px
  padding: 1rem
  margin-bottom: 1rem

.hint
  color: #888
  margin: 0 0 0.75rem
  font-size: 0.875rem

textarea
  width: 100%
  background: #2a2a2a
  border: 1px solid #444
  color: #eee
  padding: 0.5rem
  border-radius: 4px
  font-family: monospace
  font-size: 0.875rem
  resize: vertical
  margin-bottom: 0.5rem

.actions
  display: flex
  gap: 0.5rem
  margin-top: 0.5rem

.line-row
  display: flex
  gap: 0.5rem
  align-items: center
  margin-bottom: 0.5rem
  flex-wrap: wrap

.line-input
  flex: 1
  min-width: 160px

.path-input
  flex: 1
  min-width: 260px

.size-input
  width: 3rem

.image-row
  display: flex
  gap: 0.75rem
  align-items: center
  margin-bottom: 0.75rem
  flex-wrap: wrap

input[type="text"], input[type="number"], input:not([type]), select
  background: #2a2a2a
  border: 1px solid #444
  color: #eee
  padding: 0.3rem 0.5rem
  border-radius: 4px

button
  background: #2563eb
  color: #fff
  border: none
  padding: 0.35rem 0.75rem
  border-radius: 4px
  cursor: pointer

  &:disabled
    opacity: 0.4
    cursor: not-allowed

  &:not(:disabled):hover
    background: #1d4ed8

.response
  background: #0d0d0d
  border: 1px solid #333
  border-radius: 4px
  padding: 0.75rem
  font-size: 0.875rem
  white-space: pre-wrap
  word-break: break-all

.error
  color: #f87171
  margin-top: 0.5rem
</style>
