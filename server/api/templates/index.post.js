// /server/api/templates/index.post.js
import { writeFile } from "fs/promises"
import { join } from "path"
import yaml from "js-yaml"

export default defineEventHandler(async (event) => {
  const { name, header = "", body = "", footer = "", options = {} } = await readBody(event)

  if (!name?.trim()) throw createError({ statusCode: 400, message: "name required" })
  if (!/^[\w-]+$/.test(name)) throw createError({ statusCode: 400, message: "name must be alphanumeric, dashes, or underscores" })

  const config = useRuntimeConfig()
  const doc    = { name, options, header, footer, body }
  await writeFile(join(config.templatesPath, `${name}.yaml`), yaml.dump(doc, { lineWidth: -1 }), "utf8")
  return { name }
})
