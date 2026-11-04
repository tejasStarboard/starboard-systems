import {
  Body,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Text,
} from "@react-email/components"

import type { QuoteDocumentView } from "@starboard/lib-contracts"

import { muted, QuoteBody } from "./parts"
import {
  quoteEmailSubject,
  registerQuoteEmailTemplate,
  type QuoteEmailTemplate,
} from "./registry"

export const LETTERHEAD_QUOTE_EMAIL_TEMPLATE_ID =
  "quoting.email.template.letterhead"

const ACCENT = "#0b3d66"

/**
 * Branded alternate: org logo + name + address header, accent rule, contact
 * footer — all from `QuoteDocumentView.org` (missing fields collapse).
 */
export function LetterheadQuoteEmail({ view }: { view: QuoteDocumentView }) {
  const { org } = view
  const contact = [
    org.letterhead.email,
    org.letterhead.phone,
    org.letterhead.website,
  ]
    .filter(Boolean)
    .join("  |  ")
  return (
    <Html>
      <Head />
      <Preview>{quoteEmailSubject(view)}</Preview>
      <Body
        style={{
          backgroundColor: "#f6f6f6",
          fontFamily: "Helvetica, Arial, sans-serif",
          margin: "0",
          padding: "24px 0",
        }}
      >
        <Container
          style={{
            backgroundColor: "#ffffff",
            border: "1px solid #e5e5e5",
            maxWidth: "600px",
            padding: "0 28px 24px",
          }}
        >
          <div
            style={{
              borderBottom: `3px solid ${ACCENT}`,
              padding: "24px 0 12px",
              marginBottom: "16px",
            }}
          >
            {org.logoUrl ? (
              <Img
                src={org.logoUrl}
                alt={org.name || "Logo"}
                height="48"
                style={{ marginBottom: "8px" }}
              />
            ) : null}
            <Text
              style={{
                color: ACCENT,
                fontSize: "18px",
                fontWeight: "700",
                margin: "0",
              }}
            >
              {org.name || `Quote ${view.quote.id}`}
            </Text>
            {org.letterhead.addressLines.map((line) => (
              <Text key={line} style={{ ...muted, margin: "0" }}>
                {line}
              </Text>
            ))}
          </div>
          <Text style={{ ...muted, fontWeight: "600" }}>
            {`Quote ${view.quote.id || "draft"}`}
          </Text>
          <QuoteBody
            view={view}
            intro={`Please find our quotation below${
              view.quote.expiryAt ? `, valid until ${view.quote.expiryAt}` : ""
            }.`}
          />
          {contact || org.letterhead.footerNote ? (
            <div style={{ borderTop: "1px solid #e5e5e5", paddingTop: "10px" }}>
              {org.letterhead.footerNote ? (
                <Text style={muted}>{org.letterhead.footerNote}</Text>
              ) : null}
              {contact ? <Text style={muted}>{contact}</Text> : null}
            </div>
          ) : null}
        </Container>
      </Body>
    </Html>
  )
}

export const letterheadQuoteEmailTemplate: QuoteEmailTemplate = {
  id: LETTERHEAD_QUOTE_EMAIL_TEMPLATE_ID,
  label: "Letterhead",
  subject: quoteEmailSubject,
  render: (view) => <LetterheadQuoteEmail view={view} />,
}

registerQuoteEmailTemplate(letterheadQuoteEmailTemplate)
