import { describe, expect, test } from "bun:test"

import { buildQuoteDocumentView } from "../lib/build-document-view"
import { goldenFobShipperQuote } from "../lib/test-fixtures"
import {
  DEFAULT_QUOTE_PDF_TEMPLATE_ID,
  LETTERHEAD_QUOTE_PDF_TEMPLATE_ID,
  listQuotePdfTemplates,
  registerQuotePdfTemplate,
  resolveQuotePdfTemplate,
} from "./index"
import { manifest } from "../manifest"
import { renderQuotePdfBytes, resolveQuotePdfContext } from "../server"

const ACTIVE = [DEFAULT_QUOTE_PDF_TEMPLATE_ID, LETTERHEAD_QUOTE_PDF_TEMPLATE_ID]
const header = (bytes: Uint8Array) =>
  new TextDecoder().decode(bytes.slice(0, 5))

describe("quoting.pdf.templates (094)", () => {
  test("manifest defines the point and self-contributes both templates", () => {
    expect(manifest.defines.extensionPoints.map((p) => p.id)).toEqual([
      "quoting.pdf.templates",
    ])
    expect(
      manifest.contributes.points["quoting.pdf.templates"].map((c) => c.id)
    ).toEqual(ACTIVE)
    expect(listQuotePdfTemplates().map((t) => t.id)).toEqual(
      expect.arrayContaining(ACTIVE)
    )
  })

  test("selection resolves with fallback to default", () => {
    const pick = (requested?: string, activeIds?: string[]) =>
      resolveQuotePdfTemplate({ requested, activeIds }).id
    expect(pick(LETTERHEAD_QUOTE_PDF_TEMPLATE_ID, ACTIVE)).toBe(
      LETTERHEAD_QUOTE_PDF_TEMPLATE_ID
    )
    expect(pick(undefined, ACTIVE)).toBe(DEFAULT_QUOTE_PDF_TEMPLATE_ID)
    expect(pick("nope", ACTIVE)).toBe(DEFAULT_QUOTE_PDF_TEMPLATE_ID)
    expect(
      pick(LETTERHEAD_QUOTE_PDF_TEMPLATE_ID, [DEFAULT_QUOTE_PDF_TEMPLATE_ID])
    ).toBe(DEFAULT_QUOTE_PDF_TEMPLATE_ID)
  })

  test("a third template can register and be selected", () => {
    registerQuotePdfTemplate({
      id: "tenant.custom",
      label: "Custom",
      renderPdf: (view) => resolveQuotePdfTemplate({}).renderPdf(view),
    })
    expect(
      resolveQuotePdfTemplate({
        requested: "tenant.custom",
        activeIds: [...ACTIVE, "tenant.custom"],
      }).id
    ).toBe("tenant.custom")
  })

  test("each built-in renders a PDF from the same view", async () => {
    const view = buildQuoteDocumentView(goldenFobShipperQuote(), {
      customerName: "Acme",
    })
    for (const id of ACTIVE) {
      const template = resolveQuotePdfTemplate({ requested: id })
      expect(template.id).toBe(id)
      const { renderToBuffer } = await import("@react-pdf/renderer")
      const bytes = await renderToBuffer(template.renderPdf(view))
      expect(header(bytes)).toBe("%PDF-")
      expect(bytes.byteLength).toBeGreaterThan(500)
    }
  })

  test("server export honors org selection + branding; bad logo falls back", async () => {
    const organization = {
      name: "Acme Freight",
      logo: "http://127.0.0.1:9/missing.png",
      metadata: JSON.stringify({
        quoteTemplates: { pdf: LETTERHEAD_QUOTE_PDF_TEMPLATE_ID },
        letterhead: { addressLines: ["1 Port Rd"], footerNote: "Reg 123" },
      }),
    }
    expect(
      resolveQuotePdfContext({ organization, activeTemplateIds: ACTIVE })
    ).toMatchObject({ templateId: LETTERHEAD_QUOTE_PDF_TEMPLATE_ID })
    // Contributor unplugged → default.
    expect(
      resolveQuotePdfContext({
        organization,
        activeTemplateIds: [DEFAULT_QUOTE_PDF_TEMPLATE_ID],
      }).templateId
    ).toBe(DEFAULT_QUOTE_PDF_TEMPLATE_ID)

    const result = await renderQuotePdfBytes({
      quote: goldenFobShipperQuote(),
      organization,
      activeTemplateIds: ACTIVE,
    })
    expect(result.template.id).toBe(LETTERHEAD_QUOTE_PDF_TEMPLATE_ID)
    expect(result.quoteNumber).toBe("AB12CD")
    expect(header(result.bytes)).toBe("%PDF-")
  })
})
