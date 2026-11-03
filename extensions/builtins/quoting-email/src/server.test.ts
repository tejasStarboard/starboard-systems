import { describe, expect, test } from "bun:test"

import { quoteDocumentViewSchema } from "@starboard/lib-contracts"
import { buildQuoteDocumentView } from "@starboard/ext-quoting-pdf/view"
import { goldenFobShipperQuote } from "@starboard/ext-quoting-pdf/test-fixtures"

import { manifest } from "./manifest"
import { renderQuoteEmailPreview } from "./server"
import {
  DEFAULT_QUOTE_EMAIL_TEMPLATE_ID,
  LETTERHEAD_QUOTE_EMAIL_TEMPLATE_ID,
  listQuoteEmailTemplates,
} from "./templates"

const ACTIVE = [
  DEFAULT_QUOTE_EMAIL_TEMPLATE_ID,
  LETTERHEAD_QUOTE_EMAIL_TEMPLATE_ID,
]

describe("renderQuoteEmailPreview (092/094)", () => {
  test("HTML totals match the shared view (Incoterm exclusions honored)", async () => {
    const quote = goldenFobShipperQuote()
    const view = buildQuoteDocumentView(quote)
    expect(quoteDocumentViewSchema.safeParse(view).success).toBe(true)
    expect(view.totals.grandTotal).toBe(1100)

    const { subject, html, templateId } = await renderQuoteEmailPreview({
      quote,
      customerName: "Acme Ltd",
    })
    expect(templateId).toBe(DEFAULT_QUOTE_EMAIL_TEMPLATE_ID)
    expect(subject).toBe("Quote AB12CD · CNSHA → USLAX")
    expect(html).toContain("Hi Acme Ltd,")
    expect(html).toContain("CNSHA")
    expect(html).toContain("Grand total: ")
    expect(html).toContain("USD 1100.00")
    expect(html).toContain("Excluded by Incoterm")
    expect(html).not.toContain("USD 1225.00")
  })

  test("manifest defines the point and self-contributes both templates", () => {
    expect(manifest.defines.extensionPoints.map((p) => p.id)).toEqual([
      "quoting.email.templates",
    ])
    expect(
      manifest.contributes.points["quoting.email.templates"].map((c) => c.id)
    ).toEqual(ACTIVE)
    expect(listQuoteEmailTemplates().map((t) => t.id)).toEqual(
      expect.arrayContaining(ACTIVE)
    )
  })

  test("org-selected letterhead template binds org name/logo/address", async () => {
    const organization = {
      name: "Acme Freight",
      logo: "https://cdn.example.com/logo.png",
      metadata: JSON.stringify({
        quoteTemplates: { email: LETTERHEAD_QUOTE_EMAIL_TEMPLATE_ID },
        letterhead: { addressLines: ["1 Port Rd"], phone: "+31 10 555" },
      }),
    }
    const letter = await renderQuoteEmailPreview({
      quote: goldenFobShipperQuote(),
      organization,
      activeTemplateIds: ACTIVE,
    })
    expect(letter.templateId).toBe(LETTERHEAD_QUOTE_EMAIL_TEMPLATE_ID)
    expect(letter.html).toContain("Acme Freight")
    expect(letter.html).toContain("https://cdn.example.com/logo.png")
    expect(letter.html).toContain("1 Port Rd")
    expect(letter.html).toContain("USD 1100.00")

    // Contributor unplugged → default template.
    const fallback = await renderQuoteEmailPreview({
      quote: goldenFobShipperQuote(),
      organization,
      activeTemplateIds: [DEFAULT_QUOTE_EMAIL_TEMPLATE_ID],
    })
    expect(fallback.templateId).toBe(DEFAULT_QUOTE_EMAIL_TEMPLATE_ID)
    expect(fallback.html).not.toContain("1 Port Rd")
  })
})
