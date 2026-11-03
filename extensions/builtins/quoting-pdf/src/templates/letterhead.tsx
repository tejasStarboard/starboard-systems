import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer"

import {
  formatQuoteMoney,
  type QuoteDocumentView,
} from "@starboard/lib-contracts"

import { ChargeRows, LaneBlock } from "./parts"
import { registerQuotePdfTemplate, type QuotePdfTemplate } from "./registry"

export const LETTERHEAD_QUOTE_PDF_TEMPLATE_ID =
  "quoting.pdf.template.letterhead"

const ACCENT = "#0b3d66"

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingHorizontal: 48,
    paddingBottom: 72,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  head: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 2,
    borderBottomColor: ACCENT,
    paddingBottom: 10,
    marginBottom: 14,
  },
  orgName: { fontSize: 16, fontFamily: "Helvetica-Bold", color: ACCENT },
  small: { fontSize: 9, color: "#555555" },
  logo: { width: 120, height: 48, objectFit: "contain" },
  route: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#eef3f8",
    padding: 8,
    marginBottom: 12,
  },
  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 28,
    borderTopWidth: 1,
    borderTopColor: "#cccccc",
    paddingTop: 6,
    fontSize: 8,
    color: "#555555",
    textAlign: "center",
  },
})

/**
 * Branded alternate `quoting.pdf.templates` contribution: org logo + name +
 * letterhead block, accent rule, route/validity banner, right-aligned totals
 * and a contact footer — all read from `QuoteDocumentView.org` (missing
 * logo/fields simply collapse).
 */
function LetterheadQuoteDocument({ view }: { view: QuoteDocumentView }) {
  const { org, quote, totals } = view
  const { letterhead } = org
  const contact = [letterhead.email, letterhead.phone, letterhead.website]
    .filter(Boolean)
    .join("  |  ")
  return (
    <Document title={`Quote ${quote.id}`} author={org.name || undefined}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.head} fixed>
          <View>
            {org.logoUrl ? (
              <Image src={org.logoUrl} style={styles.logo} />
            ) : null}
            <Text style={styles.orgName}>{org.name || "Quotation"}</Text>
            {letterhead.addressLines.map((line) => (
              <Text key={line} style={styles.small}>
                {line}
              </Text>
            ))}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ fontSize: 14, fontFamily: "Helvetica-Bold" }}>
              {`QUOTE ${quote.id}`}
            </Text>
            <Text style={styles.small}>{quote.status.toUpperCase()}</Text>
            {view.customer.name ? (
              <Text style={styles.small}>{`For: ${view.customer.name}`}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.route}>
          <Text>{`Valid ${quote.effectiveFrom || "-"} to ${quote.expiryAt || "-"}`}</Text>
          <Text>{`Incoterm ${quote.incoterm || "-"} (${quote.customerRole})`}</Text>
          <Text>{`Currency ${quote.currencyCode || "not set"}`}</Text>
        </View>

        {view.lanes.map((lane) => (
          <LaneBlock
            key={lane.index}
            lane={lane}
            currencyCode={totals.currencyCode}
            accent={ACCENT}
          />
        ))}
        {view.globals.length > 0 ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", color: ACCENT }}>
              Global charges
            </Text>
            <ChargeRows
              charges={view.globals}
              fallbackCurrency={totals.currencyCode}
            />
          </View>
        ) : null}

        <View style={{ alignItems: "flex-end", marginTop: 6 }}>
          <Text
            style={{
              fontSize: 13,
              fontFamily: "Helvetica-Bold",
              color: ACCENT,
            }}
          >
            {`Total ${formatQuoteMoney(totals.currencyCode, totals.grandTotal)}`}
          </Text>
        </View>
        {view.notes.map((note) => (
          <Text key={note} style={[styles.small, { marginTop: 3 }]}>
            {note}
          </Text>
        ))}

        <View style={styles.footer} fixed>
          {letterhead.footerNote ? <Text>{letterhead.footerNote}</Text> : null}
          {contact ? <Text>{contact}</Text> : null}
        </View>
      </Page>
    </Document>
  )
}

export const letterheadQuotePdfTemplate: QuotePdfTemplate = {
  id: LETTERHEAD_QUOTE_PDF_TEMPLATE_ID,
  label: "Letterhead",
  renderPdf: (view) => <LetterheadQuoteDocument view={view} />,
}

registerQuotePdfTemplate(letterheadQuotePdfTemplate)
