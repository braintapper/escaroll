// /server/api/templates/[name].get.js
import { loadTemplate } from "../../utils/loadTemplate.js"

export default defineEventHandler(async (event) => {
  const name   = getRouterParam(event, "name")
  const config = useRuntimeConfig()
  return loadTemplate(name, config.templatesPath)
})
