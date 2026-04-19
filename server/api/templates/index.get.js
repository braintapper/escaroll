// /server/api/templates/index.get.js
import { readdir } from "fs/promises"

export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const files  = await readdir(config.templatesPath)
  return files
    .filter(f => f.endsWith(".yaml"))
    .map(f => f.replace(/\.yaml$/, ""))
    .sort()
})
