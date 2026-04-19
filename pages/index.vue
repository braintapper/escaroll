<!-- /pages/index.vue -->
<template>
  <div class="container">
    <h1>ESC/POS Print Tester</h1>

    <!-- Test print -->
    <section>
      <h2>Test Page</h2>
      <button :disabled="loading" @click="testPrint">Print Test Page</button>
    </section>

    <!-- Text print -->
    <section>
      <h2>Print Text</h2>
      <p class="hint">
        One line per entry. Use the controls to set alignment, size, and bold.
      </p>
      <div v-for="(line, i) in textLines" :key="i" class="line-row">
        <input v-model="line.content" placeholder="Line text" class="line-input" />
        <select v-model="line.align">
          <option :value="0">Left</option>
          <option :value="1">Center</option>
          <option :value="2">Right</option>
        </select>
        <label>
          <input v-model="line.bold" type="checkbox" /> Bold
        </label>
        <label>
          Size
          <input v-model.number="line.size[0]" type="number" min="1" max="8" class="size-input" />
          ×
          <input v-model.number="line.size[1]" type="number" min="1" max="8" class="size-input" />
        </label>
        <button @click="textLines.splice(i, 1)">✕</button>
      </div>
      <button @click="addLine">+ Add Line</button>
      <button :disabled="loading || textLines.length === 0" @click="printText">Print</button>
    </section>

    <!-- Image print -->
    <section>
      <h2>Print Image</h2>
      <p class="hint">Provide an absolute path to a PNG or SVG on the server.</p>
      <div class="image-row">
        <input v-model="imagePath" placeholder="/data/images/source/logo.png" class="path-input" />
        <label>
          Threshold
          <input v-model.number="threshold" type="number" min="0" max="255" class="size-input" />
        </label>
      </div>
      <button :disabled="loading || !imagePath" @click="printImage">Print Image</button>
    </section>

    <!-- Response -->
    <section v-if="response">
      <h2>Response</h2>
      <pre class="response">{{ JSON.stringify(response, null, 2) }}</pre>
    </section>

    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script setup>
const loading = ref(false)
const response = ref(null)
const error = ref(null)

const textLines = ref([
  { content: "Hello, world!", align: 1, bold: true, size: [2, 2] },
  { content: "Normal text line", align: 0, bold: false, size: [1, 1] },
])

const imagePath = ref("")
const threshold = ref(128)

const call = async (url, body) => {
  loading.value = true
  error.value = null
  response.value = null
  try {
    response.value = await $fetch(url, { method: "POST", body })
  } catch (e) {
    error.value = e?.data?.message ?? e.message
  } finally {
    loading.value = false
  }
}

const testPrint = () => call("/api/print/test")

const addLine = () => {
  textLines.value.push({ content: "", align: 0, bold: false, size: [1, 1] })
}

const printText = () => {
  call("/api/print/text", { lines: textLines.value })
}

const printImage = () => {
  call("/api/print/image", { imagePath: imagePath.value, threshold: threshold.value })
}
</script>

<style>
*, *::before, *::after { box-sizing: border-box }

body {
  font-family: system-ui, sans-serif;
  background: #111;
  color: #eee;
  margin: 0;
  padding: 1rem;
}

.container {
  max-width: 700px;
  margin: 0 auto;
}

h1 { margin-bottom: 1.5rem }
h2 { margin: 0 0 0.5rem }

section {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.hint { color: #888; margin: 0 0 0.75rem; font-size: 0.875rem }

.line-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.line-input  { flex: 1; min-width: 160px }
.path-input  { flex: 1; min-width: 260px }
.size-input  { width: 3rem }

.image-row {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}

input[type="text"], input[type="number"], input:not([type]), select {
  background: #2a2a2a;
  border: 1px solid #444;
  color: #eee;
  padding: 0.3rem 0.5rem;
  border-radius: 4px;
}

button {
  background: #2563eb;
  color: #fff;
  border: none;
  padding: 0.35rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
}
button:disabled { opacity: 0.4; cursor: not-allowed }
button:not(:disabled):hover { background: #1d4ed8 }

.response {
  background: #0d0d0d;
  border: 1px solid #333;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.875rem;
  white-space: pre-wrap;
  word-break: break-all;
}

.error { color: #f87171; margin-top: 0.5rem }
</style>
