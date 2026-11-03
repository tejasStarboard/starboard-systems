// Importing this module registers the built-in templates (self-contributions).
export {
  DEFAULT_QUOTE_EMAIL_TEMPLATE_ID,
  QUOTING_EMAIL_TEMPLATES_POINT,
  listQuoteEmailTemplates,
  quoteEmailSubject,
  registerQuoteEmailTemplate,
  resolveQuoteEmailTemplate,
  type QuoteEmailTemplate,
} from "./registry"
export { StandardQuoteEmail, standardQuoteEmailTemplate } from "./standard"
export {
  LETTERHEAD_QUOTE_EMAIL_TEMPLATE_ID,
  LetterheadQuoteEmail,
  letterheadQuoteEmailTemplate,
} from "./letterhead"
