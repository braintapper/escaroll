// nuxt.config.js
import Aura from "@primevue/themes/aura"

export default defineNuxtConfig({
  modules: ["@primevue/nuxt-module"],

  primevue: {
    autoImport: true,
    options: {
      theme: {
        preset: Aura,
        options: {
          darkModeSelector: ".app-dark",
        },
      },
    },
  },

  runtimeConfig: {
    printerIp:     process.env.ESCAROLL_PRINTER_IP     || "192.168.1.17",
    printerPort:   9100,
    templatesPath: process.env.ESCAROLL_TEMPLATES_PATH || "./data/templates",
  },

  nitro: {
    externals: {
      external: ["sharp"],
    },
  },
})
