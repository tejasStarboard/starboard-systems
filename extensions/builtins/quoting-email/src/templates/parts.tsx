import { Hr, Section, Text } from "@react-email/components"

import {
  formatQuoteMoney,
  type QuoteDocumentCharge,
  type QuoteDocumentView,
} from "@starboard/lib-contracts"

/** Shared display-only blocks for the built-in email templates. */

export const paragraph = {
  color: "#333333",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
}

export const muted = {
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
const table = { borderCollapse: "collapse" as const, fontSize: "13px" }
const cellLabel = { color: "#333333", padding: "4px 0" }
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
const flag = { color: "#737373", fontSize: "11px" }
const grand = {
  color: "#111111",
  fontSize: "16px",
  fontWeight: "600",
  margin: "12px 0 4px",
}

function ChargeRow({
  charge,
  currency,
}: {
  charge: QuoteDocumentCharge
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
      <td style={cellAmount}>
        {formatQuoteMoney(charge.currencyCode || currency, charge.amount)}
      </td>
    </tr>
  )
}

/** Greeting + validity/Incoterm notes + lane tables + globals + grand total. */
export function QuoteBody({
  view,
  intro,
}: {
  view: QuoteDocumentView
  intro?: string
}) {
  const currency = view.totals.currencyCode
  return (
    <>
      <Text style={paragraph}>{`Hi ${view.customer.name || "there"},`}</Text>
      <Text style={paragraph}>
        {intro ?? "Please find our quotation below."}
      </Text>
      {view.lanes.map((lane) => (
        <Section key={lane.index} style={laneBox}>
          <Text style={laneTitle}>
            {view.lanes.length > 1 ? `Lane ${lane.index}: ` : ""}
            {lane.origin || "-"} → {lane.destination || "-"}
          </Text>
          {lane.cargo.summary ? (
            <Text style={muted}>{lane.cargo.summary}</Text>
          ) : null}
          <Text style={muted}>Rate: {lane.rateLabel}</Text>
          <table width="100%" style={table}>
            <tbody>
              {lane.sections.flatMap((section) =>
                section.charges.map((charge, row) => (
                  <ChargeRow
                    key={`${section.leg}-${charge.name}-${row}`}
                    charge={charge}
                    currency={currency}
                  />
                ))
              )}
              <tr>
                <td style={cellTotal}>Lane total</td>
                <td style={{ ...cellAmount, ...cellTotal }}>
                  {formatQuoteMoney(currency, lane.total)}
                </td>
              </tr>
            </tbody>
          </table>
        </Section>
      ))}
      {view.globals.length > 0 ? (
        <Section style={laneBox}>
          <Text style={laneTitle}>Global charges</Text>
          <table width="100%" style={table}>
            <tbody>
              {view.globals.map((charge, row) => (
                <ChargeRow
                  key={`${charge.name}-${row}`}
                  charge={charge}
                  currency={currency}
                />
              ))}
            </tbody>
          </table>
        </Section>
      ) : null}
      <Hr />
      <Text style={grand} data-testid="quote-email-grand-total">
        {`Grand total: ${formatQuoteMoney(currency, view.totals.grandTotal)}`}
      </Text>
      {view.notes.map((note) => (
        <Text key={note} style={muted}>
          {note}
        </Text>
      ))}
    </>
  )
}
