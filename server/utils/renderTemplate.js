// /server/utils/renderTemplate.js
import Handlebars from "handlebars"
import { substitute } from "./substitute.js"

// Render a loaded template against data, then run token substitution on all three sections.
// Ordering matters: Handlebars first (data values may contain date tokens),
// then substitute so {date:...} tokens in both static and dynamic content resolve.
export const renderTemplate = (template, data) => {
  const renderBody = Handlebars.compile(template.body)

  return {
    header: substitute(template.header),
    body:   substitute(renderBody(data)),
    footer: substitute(template.footer),
  }
}
