// nuxt.config.js
export default defineNuxtConfig({
  runtimeConfig: {
    printerIp: process.env.POS_POC_PRINTER_IP || "192.168.1.17",
    printerPort: 9100,
  },

  nitro: {
    externals: {
      external: ["sharp"],
    },
  },
})
