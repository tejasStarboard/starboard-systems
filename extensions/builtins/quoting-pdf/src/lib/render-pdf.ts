import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

import type { QuotePdfModel } from "./build-pdf-model"

function money(currency: string, amount: number): string {
  return currency ? `${currency} ${amount.toFixed(2)}` : amount.toFixed(2)
}

/**
 * Lean QV2-shaped PDF (header, lanes, charges, globals, Incoterm notes).
 * Not pixel-perfect prod parity.
 */
export async function renderQuotePdf(
  model: QuotePdfModel
): Promise<Uint8Array> {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  let page = doc.addPage([612, 792])
  let y = 752
  const left = 48
  const width = 516
  const line = 14

  const ensureSpace = (need: number) => {
    if (y - need < 48) {
      page = doc.addPage([612, 792])
      y = 752
    }
  }

  const write = (
    text: string,
    opts?: { size?: number; font?: typeof font; x?: number }
  ) => {
    const size = opts?.size ?? 10
    ensureSpace(size + 4)
    page.drawText(text, {
      x: opts?.x ?? left,
      y,
      size,
      font: opts?.font ?? font,
      color: rgb(0.1, 0.1, 0.1),
      maxWidth: width,
    })
    y -= size + 4
  }

  write("Quote", { size: 18, font: bold })
  write(`Number: ${model.quoteId}`, { font: bold })
  write(`Status: ${model.status}`)
  write(`Currency: ${model.currencyCode || "not set"}`)
  write(`Valid: ${model.effectiveFrom || "-"} -> ${model.expiryAt || "-"}`)
  write(`Incoterm: ${model.incoterm} (${model.customerRole})`)
  if (model.excludedBuckets.length > 0) {
    write(`Excluded buckets: ${model.excludedBuckets.join(", ")}`)
  }
  y -= 6

  for (const lane of model.lanes) {
    ensureSpace(80)
    write(
      `Lane ${lane.index}: ${lane.origin || "-"} -> ${lane.destination || "-"}`,
      { font: bold, size: 12 }
    )
    write(`Selected rate: ${lane.rateLabel}`)
    for (const charge of lane.charges) {
      const flags = [
        charge.absorbed ? "absorbed" : null,
        !charge.included ? "not included" : null,
        charge.note ?? null,
      ]
        .filter(Boolean)
        .join(", ")
      const amount =
        charge.amount == null ? "-" : money(model.currencyCode, charge.amount)
      write(
        `  - [${charge.leg}] ${charge.name}: ${amount}${flags ? ` (${flags})` : ""}`
      )
    }
    write(
      `  Subtotal ${money(model.currencyCode, lane.subtotal)}  Markup ${money(model.currencyCode, lane.markup)}  Total ${money(model.currencyCode, lane.total)}`,
      { font: bold }
    )
    y -= 4
  }

  if (model.globals.length > 0) {
    write("Global charges", { font: bold, size: 12 })
    for (const charge of model.globals) {
      const amount =
        charge.amount == null ? "-" : money(model.currencyCode, charge.amount)
      write(`  - ${charge.name}: ${amount}`)
    }
    y -= 4
  }

  write(`Grand total: ${money(model.currencyCode, model.grandTotal)}`, {
    font: bold,
    size: 12,
  })

  return doc.save()
}
