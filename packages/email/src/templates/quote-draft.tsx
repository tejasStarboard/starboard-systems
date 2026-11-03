import { Hr, Section, Text, render } from "@react-email/components"

import { EmailLayout } from "./layout"

/**
 * Display-only quote draft (ticket 092). Every amount is precomputed upstream
 * (the same model as the 083 PDF, i.e. `@starboard/lib-pricing`) — this
 * template never does pricing math. `QuotePdfModel` is assignable to it.
 */
export type QuoteDraftEmailCharge = {
  name: string
  leg: string
  amount: number | null
  included: boolean
  absorbed: boolean
  note?: string
}

export type QuoteDraftEmailLane = {
  index: number
  origin: string
  destination: string
  rateLabel: string
  charges: QuoteDraftEmailCharge[]
  subtotal: number
  markup: number
  total: number
}

export type QuoteDraftEmailProps = {
  quoteId: string
  customerName?: string
  currencyCode: string
  effectiveFrom: string
  expiryAt: string
  incoterm: string
  customerRole: string
  excludedBuckets: readonly string[]
  globals: QuoteDraftEmailCharge[]
  lanes: QuoteDraftEmailLane[]
  grandTotal: number
}

function money(currency: string, amount: number | null): string {
  return amount == null ? "-" : `${currency} ${amount.toFixed(2)}`
}

export function quoteDraftEmailSubject(
  props: Pick<QuoteDraftEmailProps, "quoteId" | "lanes">
): string {
  const lane = props.lanes.find((item) => item.origin && item.destination)
  const route = lane ? ` · ${lane.origin} → ${lane.destination}` : ""
  return `Quote ${props.quoteId || "draft"}${route}`
}

function ChargeRow({
  charge,
  currency,
}: {
  charge: QuoteDraftEmailCharge
  currency: string
}) {
  const flags = [
    charge.absorbed ? "absorbed" : null,
    !charge.included ? "not included" : null,
    charge.note ?? null,
  ]
    .filter(Boolean)
    .join(", ")
  return (
    <tr>
      <td style={cellLabel}>
        {charge.name}
        {flags ? <span style={flag}> ({flags})</span> : null}
      </td>
      <td style={cellAmount}>{money(currency, charge.amount)}</td>
    </tr>
  )
}

export function QuoteDraftEmail(props: QuoteDraftEmailProps) {
  const {
    quoteId,
    customerName,
    currencyCode,
    effectiveFrom,
    expiryAt,
    incoterm,
    customerRole,
    excludedBuckets,
    globals,
    lanes,
    grandTotal,
  } = props
  return (
    <EmailLayout
      preview={quoteDraftEmailSubject(props)}
      heading={`Quote ${quoteId || "draft"}`}
      width={600}
    >
      <Text style={paragraph}>{`Hi ${customerName || "there"},`}</Text>
      <Text style={paragraph}>
        Please find our quotation below
        {effectiveFrom || expiryAt
          ? `, valid ${effectiveFrom || "-"} to ${expiryAt || "-"}`
          : ""}
        .
      </Text>
      {incoterm ? (
        <Text style={muted}>
          Incoterm {incoterm} ({customerRole})
          {excludedBuckets.length > 0
            ? ` — excludes ${excludedBuckets.join(", ")} charges`
            : ""}
        </Text>
      ) : null}
      {lanes.map((lane) => (
        <Section key={lane.index} style={laneBox}>
          <Text style={laneTitle}>
            {lanes.length > 1 ? `Lane ${lane.index}: ` : ""}
            {lane.origin || "-"} → {lane.destination || "-"}
          </Text>
          <Text style={muted}>Rate: {lane.rateLabel}</Text>
          <table width="100%" style={table}>
            <tbody>
              {lane.charges.map((charge, row) => (
                <ChargeRow
                  key={`${charge.name}-${row}`}
                  charge={charge}
                  currency={currencyCode}
                />
              ))}
              <tr>
                <td style={cellTotal}>Lane total</td>
                <td style={{ ...cellAmount, ...cellTotal }}>
                  {money(currencyCode, lane.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      ))}
      {globals.length > 0 ? (
        <Section style={laneBox}>
          <Text style={laneTitle}>Global charges</Text>
          <table width="100%" style={table}>
            <tbody>
              {globals.map((charge, row) => (
                <ChargeRow
                  key={`${charge.name}-${row}`}
                  charge={charge}
                  currency={currencyCode}
                />
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}
      <Hr />
      <Text style={grand} data-testid="quote-email-grand-total">
        {`Grand total: ${money(currencyCode, grandTotal)}`}
      </Text>
      <Text style={muted}>Draft — rates subject to confirmation.</Text>
    </EmailLayout>
  )
}

export default QuoteDraftEmail

/** Static HTML for the Email preview tab / copy-HTML (server-side render). */
export async function renderQuoteDraftEmail(
  props: QuoteDraftEmailProps
): Promise<{ subject: string; html: string }> {
  return {
    subject: quoteDraftEmailSubject(props),
    html: await render(<QuoteDraftEmail {...props} />),
  }
}

const paragraph = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
}

const muted = {
  color: "#737373",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 8px",
}

const laneBox = {
  border: "1px solid #e5e5e5",
  margin: "12px 0",
  padding: "12px 14px",
}

const laneTitle = {
  color: "#111111",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 4px",
}

const table = {
  borderCollapse: "collapse" as const,
  fontSize: "13px",
}

const cellLabel = {
  color: "#333333",
  padding: "4px 0",
}

const cellAmount = {
  color: "#111111",
  padding: "4px 0",
  textAlign: "right" as const,
  whiteSpace: "nowrap" as const,
}

const cellTotal = {
  borderTop: "1px solid #e5e5e5",
  color: "#111111",
  fontWeight: "600",
  paddingTop: "8px",
}

const flag = {
  color: "#737373",
  fontSize: "11px",
}

const grand = {
  color: "#111111",
  fontSize: "16px",
  fontWeight: "600",
  margin: "12px 0 4px",
}
