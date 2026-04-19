// /server/utils/loadTemplate.js
import { readFile } from "fs/promises"
import { join } from "path"
import yaml from "js-yaml"

export const loadTemplate = async (templateName, templatesPath) => {
  const filePath = join(templatesPath, `${templateName}.yaml`)
  const raw      = await readFile(filePath, "utf8")
  const doc      = yaml.load(raw)

  return {
    name:    doc.name    ?? templateName,
    header:  doc.header  ?? "",
    footer:  doc.footer  ?? "",
    body:    doc.body    ?? "",
    options: doc.options ?? {},
  }
}
