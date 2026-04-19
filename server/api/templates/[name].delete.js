// /server/api/templates/[name].delete.js
import { unlink } from "fs/promises"
import { join } from "path"

export default defineEventHandler(async (event) => {
  const name   = getRouterParam(event, "name")
  const config = useRuntimeConfig()
  await unlink(join(config.templatesPath, `${name}.yaml`))
  return { deleted: name }
})
