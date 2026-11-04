import { Text, View } from "@react-pdf/renderer"

import {
  formatQuoteMoney,
  type QuoteDocumentCharge,
  type QuoteDocumentLane,
} from "@starboard/lib-contracts"

/** Shared display-only building blocks for the built-in PDF templates. */

export function chargeFlags(charge: QuoteDocumentCharge): string {
  return [
    charge.absorbed ? "absorbed" : null,
    !charge.included ? "not included" : null,
    charge.note ?? null,
  ]
    .filter(Boolean)
    .join(", ")
}

/** `CNSHA via SGSIN` style one-liner for a lane end. */
export function portLabel(port: string, via: string): string {
  const base = port || "-"
  return via ? `${base} (via ${via})` : base
}

export function laneRoute(lane: QuoteDocumentLane): string {
  return `${portLabel(lane.origin, lane.originVia)} to ${portLabel(lane.destination, lane.destinationVia)}`
}

export function ChargeRows({
  charges,
  fallbackCurrency,
  accent,
}: {
  charges: QuoteDocumentCharge[]
  fallbackCurrency: string
  accent?: string
}) {
  return (
    <View>
      {charges.map((charge, row) => {
        const flags = chargeFlags(charge)
        return (
          <View
            key={`${charge.name}-${row}`}
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 2,
            }}
          >
            <Text style={{ flexGrow: 1, color: accent }}>
              {charge.name}
              {flags ? ` (${flags})` : ""}
            </Text>
            <Text>
              {formatQuoteMoney(
                charge.currencyCode || fallbackCurrency,
                charge.amount
              )}
            </Text>
          </View>
        )
      })}
    </View>
  )
}

export function LaneBlock({
  lane,
  currencyCode,
  accent,
}: {
  lane: QuoteDocumentLane
  currencyCode: string
  accent?: string
}) {
  const door = [
    lane.pickup ? `Pickup: ${lane.pickup}` : "",
    lane.delivery ? `Delivery: ${lane.delivery}` : "",
  ].filter(Boolean)
  return (
    <View style={{ marginBottom: 12 }} wrap>
      <Text
        style={{ fontFamily: "Helvetica-Bold", fontSize: 12, color: accent }}
      >
        {`Lane ${lane.index}: ${laneRoute(lane)}`}
      </Text>
      {lane.cargo.summary ? (
        <Text style={{ color: "#555555" }}>{lane.cargo.summary}</Text>
      ) : null}
      {door.map((line) => (
        <Text key={line} style={{ color: "#555555" }}>
          {line}
        </Text>
      ))}
      <Text style={{ color: "#555555", marginBottom: 4 }}>
        {`Selected rate: ${lane.rateLabel}`}
      </Text>
      {lane.sections.map((section) => (
        <View key={section.leg} style={{ marginBottom: 4 }}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{section.label}</Text>
          <ChargeRows
            charges={section.charges}
            fallbackCurrency={currencyCode}
          />
        </View>
      ))}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          borderTopWidth: 1,
          borderTopColor: "#cccccc",
          paddingTop: 3,
        }}
      >
        <Text style={{ fontFamily: "Helvetica-Bold" }}>Lane total</Text>
        <Text style={{ fontFamily: "Helvetica-Bold" }}>
          {formatQuoteMoney(currencyCode, lane.total)}
        </Text>
      </View>
    </View>
  )
}
