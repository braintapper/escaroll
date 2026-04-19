<!-- /pages/index.vue -->
<template lang="pug">
Toast
ConfirmDialog

Tabs(value="print" class="app-tabs")
  TabList
    Tab(value="print") Print
    Tab(value="templates") Templates

  TabPanels

    //- ── PRINT TAB ──────────────────────────────────────────────────────────
    TabPanel(value="print")
      .container

        //- Test print
        section
          h2 Test Page
          button(:disabled="loadingRef" @click="testPrint") Print Test Page

        //- Markdown print
        section
          h2 Print Markdown
          p.hint
            | # h1 &nbsp;## h2 &nbsp;### h3 &nbsp;--- hr &nbsp;#&lt; left &nbsp;##&gt; right
            br
            | * bullet &nbsp;[ ] checkbox &nbsp;[x] checkbox &nbsp;*inline bold*
            br
            | ![](path) image &nbsp;![&lt; w=80% h=50%](path) alignment &amp; scale
            br
            | | Col | table &nbsp;|:20|:5:|10:| separator &nbsp;{date:today|%B %e}
          label.section-label Header
          textarea(v-model="mdHeaderRef" rows="3" placeholder="# My Shop\nOptional header")
          label.section-label Body
          textarea(v-model="mdBodyRef" rows="6" placeholder="* Item one\n[ ] Task")
          label.section-label Footer
          textarea(v-model="mdFooterRef" rows="3" placeholder="Thank you!")
          .md-options
            label
              input(v-model="mdDitherRef" type="checkbox")
              |  Dither images
            label(v-if="!mdDitherRef")
              | Threshold&nbsp;
              input(v-model.number="mdThresholdRef" type="number" min="0" max="255" class="size-input")
          .actions
            button(
              :disabled="loadingRef || (!mdHeaderRef.trim() && !mdBodyRef.trim() && !mdFooterRef.trim())"
              @click="printMarkdown"
            ) Print Markdown

        //- Line-builder print
        section
          h2 Print Text
          p.hint One line per entry.
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
          p.hint Absolute path to a PNG or SVG on the server.
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

        //- Response / error
        section(v-if="responseRef")
          h2 Response
          pre.response {{ JSON.stringify(responseRef, null, 2) }}
        p.error(v-if="errorRef") {{ errorRef }}

    //- ── TEMPLATES TAB ──────────────────────────────────────────────────────
    TabPanel(value="templates")
      Splitter.template-editor
        //- Left — template list
        SplitterPanel(:size="22" :minSize="15")
          .list-panel
            .list-header Templates
            Listbox(
              v-model="selectedNameRef"
              :options="templateNamesRef"
              class="template-list"
            )
            .list-footer
              Button(
                label="Add" icon="pi pi-plus" size="small"
                class="add-btn"
                @click="newTemplate"
              )

        //- Right — editor
        SplitterPanel(:size="78")
          .editor-panel

            //- Toolbar
            .editor-toolbar
              InputText(
                v-model="editNameRef"
                placeholder="template-name"
                size="small"
                class="name-input"
              )
              .toolbar-actions
                Button(
                  label="Save" icon="pi pi-save" size="small"
                  @click="saveTemplate" :loading="savingRef"
                  :disabled="!editNameRef.trim()"
                )
                Button(
                  icon="pi pi-trash" size="small" severity="danger" text rounded
                  v-tooltip.top="'Delete'"
                  @click="confirmDelete"
                  :disabled="!selectedNameRef"
                )
                Button(
                  label="Print" icon="pi pi-print" size="small" severity="secondary"
                  @click="printFromEditor"
                  :loading="loadingRef"
                  :disabled="!editNameRef.trim()"
                )

            //- Options row
            .editor-options
              label Table gap
              InputNumber(
                v-model="editTableGapRef"
                :min="1" :max="8"
                showButtons size="small"
                class="gap-input"
              )

            //- Two-pane editor
            .editor-panes
              .editor-pane
                label.pane-label Header
                Textarea(
                  v-model="editHeaderRef"
                  autoResize
                  class="md-textarea"
                  placeholder="# Shop Name\n---"
                )
                label.pane-label Body
                Textarea(
                  v-model="editBodyRef"
                  autoResize
                  class="md-textarea"
                  placeholder="## {{title}}\n\n{{#each items}}\n* {{name}}\n{{/each}}"
                )
                label.pane-label Footer
                Textarea(
                  v-model="editFooterRef"
                  autoResize
                  class="md-textarea"
                  placeholder="---\nThank you!"
                )
              .editor-pane
                label.pane-label Test Data
                Textarea(
                  v-model="editDataRef"
                  autoResize
                  class="md-textarea"
                  placeholder='{\n  "title": "My Template"\n}'
                )

            //- Template response / error
            .editor-response(v-if="responseRef || errorRef")
              pre.response(v-if="responseRef") {{ JSON.stringify(responseRef, null, 2) }}
              p.error(v-if="errorRef") {{ errorRef }}
</template>

<script setup>
import { useToast } from "primevue/usetoast"
import { useConfirm } from "primevue/useconfirm"

// ── Shared print state ───────────────────────────────────────────────────────

const loadingRef  = ref(false)
const responseRef = ref(null)
const errorRef    = ref(null)

const call = async (url, body) => {
  loadingRef.value  = true
  errorRef.value    = null
  responseRef.value = null
  try {
    responseRef.value = await $fetch(url, { method: "POST", body })
  } catch (e) {
    errorRef.value = e?.data?.message ?? e.message
  } finally {
    loadingRef.value = false
  }
}

// ── Print tab ────────────────────────────────────────────────────────────────

const mdHeaderRef    = ref("# My Shop")
const mdBodyRef      = ref("* Bullet item\n[ ] Unchecked task\n[x] Done task\nPlain line")
const mdFooterRef    = ref("Thank you!")
const mdDitherRef    = ref(true)
const mdThresholdRef = ref(128)

const textLinesRef = ref([
  { content: "Hello, world!", align: 1, bold: true,  size: [2, 2] },
  { content: "Normal line",   align: 0, bold: false, size: [1, 1] },
])

const imagePathRef = ref("")
const ditherRef    = ref(true)
const thresholdRef = ref(128)

const testPrint     = () => call("/api/print/test")
const printMarkdown = () => call("/api/print/markdown", {
  header:    mdHeaderRef.value,
  body:      mdBodyRef.value,
  footer:    mdFooterRef.value,
  dither:    mdDitherRef.value,
  threshold: mdThresholdRef.value,
})
const addLine  = () => { textLinesRef.value.push({ content: "", align: 0, bold: false, size: [1, 1] }) }
const printText  = () => call("/api/print/text", { lines: textLinesRef.value })
const printImage = () => call("/api/print/image", { imagePath: imagePathRef.value, dither: ditherRef.value, threshold: thresholdRef.value })

// ── Templates tab ────────────────────────────────────────────────────────────

const toast   = useToast()
const confirm = useConfirm()

const templateNamesRef = ref([])
const selectedNameRef  = ref(null)
const savingRef        = ref(false)

const editNameRef     = ref("")
const editHeaderRef   = ref("")
const editBodyRef     = ref("")
const editFooterRef   = ref("")
const editTableGapRef = ref(2)
const editDataRef     = ref(JSON.stringify({
  title: "Sales Summary",
  items: [
    { name: "Coffee", qty: 2,   price: "3.50" },
    { name: "Muffin", qty: 1,   price: "2.75" },
  ],
  total: "6.25",
  note:  "Cash payment received",
}, null, 2))

const fetchTemplates = async () => {
  templateNamesRef.value = await $fetch("/api/templates")
}

const onSelectTemplate = async (name) => {
  if (!name) return
  const t = await $fetch(`/api/templates/${name}`)
  editNameRef.value     = t.name
  editHeaderRef.value   = t.header
  editBodyRef.value     = t.body
  editFooterRef.value   = t.footer
  editTableGapRef.value = t.options?.tableGap ?? 2
}

watch(selectedNameRef, onSelectTemplate)

const newTemplate = () => {
  selectedNameRef.value = null
  editNameRef.value     = ""
  editHeaderRef.value   = ""
  editBodyRef.value     = ""
  editFooterRef.value   = ""
  editTableGapRef.value = 2
}

const saveTemplate = async () => {
  savingRef.value = true
  try {
    const isNew  = !selectedNameRef.value
    const method = isNew ? "POST" : "PUT"
    const url    = isNew ? "/api/templates" : `/api/templates/${selectedNameRef.value}`
    await $fetch(url, {
      method,
      body: {
        name:    editNameRef.value.trim(),
        header:  editHeaderRef.value,
        body:    editBodyRef.value,
        footer:  editFooterRef.value,
        options: { tableGap: editTableGapRef.value },
      },
    })
    await fetchTemplates()
    selectedNameRef.value = editNameRef.value.trim()
    toast.add({ severity: "success", summary: "Saved", life: 3000 })
  } catch (e) {
    toast.add({ severity: "error", summary: "Save failed", detail: e?.data?.message ?? e.message, life: 5000 })
  } finally {
    savingRef.value = false
  }
}

const confirmDelete = () => {
  confirm.require({
    message:      `Delete "${selectedNameRef.value}"?`,
    header:       "Delete Template",
    icon:         "pi pi-exclamation-triangle",
    rejectProps:  { label: "Cancel", severity: "secondary", outlined: true },
    acceptProps:  { label: "Delete", severity: "danger" },
    accept:       deleteTemplate,
  })
}

const deleteTemplate = async () => {
  try {
    await $fetch(`/api/templates/${selectedNameRef.value}`, { method: "DELETE" })
    await fetchTemplates()
    newTemplate()
    toast.add({ severity: "info", summary: "Deleted", life: 3000 })
  } catch (e) {
    toast.add({ severity: "error", summary: "Delete failed", detail: e?.data?.message ?? e.message, life: 5000 })
  }
}

const printFromEditor = () => {
  let data = {}
  try { data = JSON.parse(editDataRef.value) } catch { /* send empty on invalid JSON */ }
  call("/api/print/template", {
    templateName: editNameRef.value.trim(),
    data,
    dither: true,
  })
}

onMounted(fetchTemplates)
</script>

<style lang="sass">
// ── Reset / base ─────────────────────────────────────────────────────────────

*, *::before, *::after
  box-sizing: border-box

body
  font-family: system-ui, sans-serif
  background: #111
  color: #eee
  margin: 0

// ── Print tab ────────────────────────────────────────────────────────────────

.container
  max-width: 700px
  margin: 0 auto
  padding: 1rem

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

.section-label
  display: block
  font-size: 0.75rem
  color: #888
  text-transform: uppercase
  letter-spacing: 0.05em
  margin-bottom: 0.25rem

.md-options
  display: flex
  gap: 1rem
  align-items: center
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

.image-row
  display: flex
  gap: 0.75rem
  align-items: center
  margin-bottom: 0.75rem
  flex-wrap: wrap

.line-input
  flex: 1
  min-width: 160px

.path-input
  flex: 1
  min-width: 260px

.size-input
  width: 3rem

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

// ── App tabs ─────────────────────────────────────────────────────────────────

.app-tabs
  height: 100vh
  display: flex
  flex-direction: column

  .p-tabpanels
    flex: 1
    overflow: hidden
    padding: 0

  .p-tabpanel
    height: 100%
    overflow-y: auto

// ── Template editor ──────────────────────────────────────────────────────────

.template-editor
  height: 100%

.list-panel
  display: flex
  flex-direction: column
  height: 100%
  border-right: 1px solid var(--p-surface-border)

.list-header
  padding: 0.75rem 1rem
  font-weight: 600
  border-bottom: 1px solid var(--p-surface-border)

.list-footer
  padding: 0.5rem
  border-top: 1px solid var(--p-surface-border)

.add-btn
  width: 100%

.template-list
  flex: 1
  border: none !important
  border-radius: 0 !important
  width: 100%

  .p-listbox-list-container
    height: 100%

.editor-panel
  display: flex
  flex-direction: column
  height: 100%
  padding: 0.75rem

.editor-toolbar
  display: flex
  align-items: center
  gap: 0.5rem
  margin-bottom: 0.75rem

.name-input
  flex: 1

.toolbar-actions
  display: flex
  gap: 0.4rem
  flex-shrink: 0

.editor-options
  display: flex
  align-items: center
  gap: 0.75rem
  margin-bottom: 0.75rem
  font-size: 0.875rem
  color: var(--p-text-muted-color)

.gap-input
  width: 7rem

.editor-panes
  display: flex
  gap: 0.75rem
  flex: 1
  min-height: 0

.editor-pane
  flex: 1
  display: flex
  flex-direction: column
  gap: 0.25rem
  overflow-y: auto

.pane-label
  font-size: 0.75rem
  color: var(--p-text-muted-color)
  text-transform: uppercase
  letter-spacing: 0.05em
  margin-top: 0.5rem

  &:first-child
    margin-top: 0

.md-textarea
  width: 100%
  font-family: monospace
  font-size: 0.875rem

.editor-response
  margin-top: 0.75rem
</style>
