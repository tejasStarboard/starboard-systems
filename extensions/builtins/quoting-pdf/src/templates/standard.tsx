import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer"

import {
  formatQuoteMoney,
  type QuoteDocumentView,
} from "@starboard/lib-contracts"

import { LaneBlock, ChargeRows } from "./parts"
import {
  DEFAULT_QUOTE_PDF_TEMPLATE_ID,
  registerQuotePdfTemplate,
  type QuotePdfTemplate,
} from "./registry"

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  meta: { color: "#333333", marginBottom: 2 },
  block: { marginTop: 10 },
  grand: { fontSize: 12, fontFamily: "Helvetica-Bold", marginTop: 8 },
})

/** Default `quoting.pdf.templates` contribution: plain, no branding. */
function StandardQuoteDocument({ view }: { view: QuoteDocumentView }) {
  const { quote, totals } = view
  return (
    <Document title={`Quote ${quote.id}`} author={view.org.name || undefined}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Quote</Text>
        <Text style={styles.meta}>{`Number: ${quote.id}`}</Text>
        <Text style={styles.meta}>{`Status: ${quote.status}`}</Text>
        {view.customer.name ? (
          <Text style={styles.meta}>{`Customer: ${view.customer.name}`}</Text>
        ) : null}
        <Text style={styles.meta}>
          {`Currency: ${quote.currencyCode || "not set"}`}
        </Text>
        <Text style={styles.meta}>
          {`Valid: ${quote.effectiveFrom || "-"} to ${quote.expiryAt || "-"}`}
        </Text>
        <Text style={styles.meta}>
          {`Incoterm: ${quote.incoterm || "-"} (${quote.customerRole})`}
        </Text>
        <View style={styles.block}>
          {view.lanes.map((lane) => (
            <LaneBlock
              key={lane.index}
              lane={lane}
              currencyCode={totals.currencyCode}
            />
          ))}
        </View>
        {view.globals.length > 0 ? (
          <View style={{ marginBottom: 8 }}>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>
              Global charges
            </Text>
            <ChargeRows
              charges={view.globals}
              fallbackCurrency={totals.currencyCode}
            />
          </View>
        ) : null}
        <Text style={styles.grand}>
          {`Grand total: ${formatQuoteMoney(totals.currencyCode, totals.grandTotal)}`}
        </Text>
        {view.notes.map((note) => (
          <Text key={note} style={[styles.meta, { marginTop: 4 }]}>
            {note}
          </Text>
        ))}
      </Page>
    </Document>
  )
}

export const standardQuotePdfTemplate: QuotePdfTemplate = {
  id: DEFAULT_QUOTE_PDF_TEMPLATE_ID,
  label: "Standard",
  renderPdf: (view) => <StandardQuoteDocument view={view} />,
}

registerQuotePdfTemplate(standardQuotePdfTemplate)
