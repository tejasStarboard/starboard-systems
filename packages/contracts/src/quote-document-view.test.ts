import { describe, expect, test } from "bun:test"

import { resolveQuoteDocumentOrgContext } from "./quote-document-org"
import { resolveQuoteTemplateId } from "./quote-document-view"

describe("resolveQuoteTemplateId (094)", () => {
  const base = {
    activeIds: ["a", "b"],
    registeredIds: ["a", "b"],
    defaultId: "a",
  }

  test("honors an active + registered pick", () => {
    expect(resolveQuoteTemplateId({ ...base, requested: "b" })).toBe("b")
  })

  test("missing / inactive / unregistered pick falls back to default", () => {
    expect(resolveQuoteTemplateId({ ...base })).toBe("a")
    expect(resolveQuoteTemplateId({ ...base, requested: "zzz" })).toBe("a")
    expect(
      resolveQuoteTemplateId({ ...base, requested: "b", activeIds: ["a"] })
    ).toBe("a")
    expect(
      resolveQuoteTemplateId({ ...base, requested: "b", registeredIds: ["a"] })
    ).toBe("a")
  })
})

describe("resolveQuoteDocumentOrgContext (094)", () => {
  test("reads name, logo, letterhead, and template picks from metadata", () => {
    const { org, templates } = resolveQuoteDocumentOrgContext({
      name: " Acme Freight ",
      logo: "https://cdn.example.com/logo.png",
      metadata: JSON.stringify({
        quoteTemplates: { pdf: "quoting.pdf.template.letterhead" },
        letterhead: {
          addressLines: ["1 Port Rd", " ", "Rotterdam"],
          email: "a@b.co",
        },
      }),
    })
    expect(org.name).toBe("Acme Freight")
    expect(org.logoUrl).toBe("https://cdn.example.com/logo.png")
    expect(org.letterhead.addressLines).toEqual(["1 Port Rd", "Rotterdam"])
    expect(org.letterhead.email).toBe("a@b.co")
    expect(templates).toEqual({
      pdf: "quoting.pdf.template.letterhead",
      email: undefined,
    })
  })

  test("garbage metadata / non-http logo degrade to defaults", () => {
    const { org, templates } = resolveQuoteDocumentOrgContext({
      name: null,
      logo: "javascript:alert(1)",
      metadata: "{not json",
    })
    expect(org.logoUrl).toBeNull()
    expect(org.name).toBe("")
    expect(org.letterhead.addressLines).toEqual([])
    expect(templates).toEqual({ pdf: undefined, email: undefined })
  })
})
