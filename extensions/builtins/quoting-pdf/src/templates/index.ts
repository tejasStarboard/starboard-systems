// Importing this module registers the built-in templates (self-contributions).
export {
  DEFAULT_QUOTE_PDF_TEMPLATE_ID,
  QUOTING_PDF_TEMPLATES_POINT,
  listQuotePdfTemplates,
  registerQuotePdfTemplate,
  resolveQuotePdfTemplate,
  withLogoFallback,
  type QuotePdfTemplate,
} from "./registry"
export { standardQuotePdfTemplate } from "./standard"
export {
  LETTERHEAD_QUOTE_PDF_TEMPLATE_ID,
  letterheadQuotePdfTemplate,
} from "./letterhead"
