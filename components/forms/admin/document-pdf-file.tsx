import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ClientDocumentWithRelations } from "@/lib/client-documents";
import {
  formatDocumentDate,
  formatMoney,
} from "@/lib/client-documents";

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 42,
    paddingHorizontal: 40,
    backgroundColor: "#fffdf9",
    color: "#231b16",
    fontSize: 10.5,
    lineHeight: 1.45,
  },
  stack: {
    display: "flex",
    flexDirection: "column",
    gap: 18,
  },
  header: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 18,
  },
  brandBlock: {
    flexGrow: 1,
    maxWidth: "62%",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  eyebrow: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#8c5327",
    fontWeight: 700,
  },
  label: {
    alignSelf: "flex-start",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1.3,
    fontWeight: 700,
    backgroundColor: "#f8eadb",
    color: "#8c5327",
  },
  heading: {
    fontSize: 28,
    lineHeight: 0.98,
    fontWeight: 700,
  },
  muted: {
    color: "#6d5d4f",
  },
  metaCard: {
    width: 220,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5d5c1",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  status: {
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1.2,
    fontWeight: 700,
    color: "#8c5327",
  },
  metaRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  metaLabel: {
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    color: "#6d5d4f",
  },
  metaValue: {
    fontSize: 10.5,
    fontWeight: 700,
    textAlign: "right",
  },
  infoGrid: {
    display: "flex",
    flexDirection: "row",
    gap: 14,
  },
  infoCard: {
    flexGrow: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eadcc9",
    backgroundColor: "#fff",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  infoTitle: {
    fontSize: 8.5,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: "#8c5327",
    fontWeight: 700,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: 700,
  },
  table: {
    borderWidth: 1,
    borderColor: "#eadcc9",
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  tableHeader: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#f7efe4",
    borderBottomWidth: 1,
    borderBottomColor: "#eadcc9",
  },
  tableRow: {
    display: "flex",
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0e7dc",
  },
  cell: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    fontSize: 9.5,
  },
  colItem: { width: "22%" },
  colDetails: { width: "32%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnit: { width: "18%", textAlign: "right" },
  colTotal: { width: "18%", textAlign: "right" },
  tableHeaderText: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontWeight: 700,
    color: "#6d5d4f",
  },
  totalsWrap: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  totalsCard: {
    width: 260,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#eadcc9",
    backgroundColor: "#fbf7f1",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  totalRow: {
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  totalPrimary: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#dbc9b5",
    fontSize: 11.5,
    fontWeight: 700,
  },
  notesGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  notesCard: {
    width: "48%",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#eadcc9",
    backgroundColor: "#fffdfa",
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  footer: {
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#eadcc9",
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  footerBrand: {
    fontSize: 11,
    fontWeight: 700,
  },
});

function getDocumentCopy(document: ClientDocumentWithRelations) {
  if (document.document_type === "invoice") {
    return {
      label: "Invoice",
      emphasis: "Payment due",
      heading: "Invoice for your confirmed event scope.",
      message:
        "This invoice outlines the approved scope, current charges, and the amount due to keep production and event scheduling on track.",
      totalLabel: "Total due",
      balanceLabel: "Remaining balance",
      footer:
        "Please reference the invoice number with your payment and contact Elel Events & Design if you need any billing clarification.",
      showDeposit: true,
    };
  }

  if (document.document_type === "receipt") {
    return {
      label: "Payment Receipt",
      emphasis: "Payment confirmed",
      heading: "Thank you. Your payment has been received.",
      message:
        "This receipt confirms your payment and keeps your event record clear as we continue planning the final details with you.",
      totalLabel: "Amount received",
      balanceLabel: "Balance remaining",
      footer:
        "Thank you for trusting Elel Events & Design. Keep this receipt for your records and planning file.",
      showDeposit: false,
    };
  }

  return {
    label: "Quote / Proposal",
    emphasis: "Prepared for your review",
    heading: "A refined proposal for your event vision.",
    message:
      "Review the scope, confirm the styling direction, and let us know what you would like adjusted before we prepare the final booking agreement.",
    totalLabel: "Proposed total",
    balanceLabel: "Estimated balance",
    footer:
      "Your event date is secured once the proposal is approved, the agreement is signed, and the deposit is received.",
    showDeposit: true,
  };
}

function NotesSection({
  title,
  value,
}: {
  title: string;
  value: string | null | undefined;
}) {
  if (!value) return null;
  return (
    <View style={styles.notesCard}>
      <Text style={styles.eyebrow}>{title}</Text>
      <Text>{value}</Text>
    </View>
  );
}

export default function DocumentPdfFile({
  document,
}: {
  document: ClientDocumentWithRelations;
}) {
  const copy = getDocumentCopy(document);

  return (
    <Document
      title={document.document_number}
      author="Elel Events & Design"
      subject={copy.label}
      creator="Elel Events & Design"
      producer="Elel Events & Design"
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.stack}>
          <View style={styles.header}>
            <View style={styles.brandBlock}>
              <Text style={styles.eyebrow}>Elel Events & Design</Text>
              <Text style={styles.label}>{copy.label}</Text>
              <Text style={styles.muted}>{copy.message}</Text>
              <Text style={styles.heading}>{copy.heading}</Text>
            </View>

            <View style={styles.metaCard}>
              <Text style={styles.status}>{document.status}</Text>
              <Text style={styles.muted}>{copy.emphasis}</Text>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Reference</Text>
                <Text style={styles.metaValue}>#{document.document_number}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Issued</Text>
                <Text style={styles.metaValue}>{formatDocumentDate(document.issue_date)}</Text>
              </View>
              {document.due_date ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Due</Text>
                  <Text style={styles.metaValue}>{formatDocumentDate(document.due_date)}</Text>
                </View>
              ) : null}
              {document.expiration_date ? (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Expires</Text>
                  <Text style={styles.metaValue}>
                    {formatDocumentDate(document.expiration_date)}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Client</Text>
              <Text style={styles.cardTitle}>{document.customer_name}</Text>
              <Text>{document.customer_email || "—"}</Text>
              <Text>{document.customer_phone || "—"}</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Event</Text>
              <Text style={styles.cardTitle}>{document.event_type || "Event"}</Text>
              <Text>{formatDocumentDate(document.event_date)}</Text>
              <Text>{document.venue_name || "Venue to be confirmed"}</Text>
              {document.venue_address ? <Text>{document.venue_address}</Text> : null}
            </View>
          </View>

          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={[styles.cell, styles.colItem]}>
                <Text style={styles.tableHeaderText}>Item</Text>
              </View>
              <View style={[styles.cell, styles.colDetails]}>
                <Text style={styles.tableHeaderText}>Details</Text>
              </View>
              <View style={[styles.cell, styles.colQty]}>
                <Text style={styles.tableHeaderText}>Qty</Text>
              </View>
              <View style={[styles.cell, styles.colUnit]}>
                <Text style={styles.tableHeaderText}>Unit</Text>
              </View>
              <View style={[styles.cell, styles.colTotal]}>
                <Text style={styles.tableHeaderText}>Total</Text>
              </View>
            </View>

            {document.line_items.map((item, index) => (
              <View
                key={item.id || `${document.id}-${index}`}
                style={[
                  styles.tableRow,
                  index === document.line_items.length - 1 ? { borderBottomWidth: 0 } : null,
                ]}
              >
                <View style={[styles.cell, styles.colItem]}>
                  <Text>{item.title}</Text>
                </View>
                <View style={[styles.cell, styles.colDetails]}>
                  <Text>{item.description || "—"}</Text>
                </View>
                <View style={[styles.cell, styles.colQty]}>
                  <Text>{String(item.quantity)}</Text>
                </View>
                <View style={[styles.cell, styles.colUnit]}>
                  <Text>${formatMoney(item.unit_price)}</Text>
                </View>
                <View style={[styles.cell, styles.colTotal]}>
                  <Text>${formatMoney(item.total_price)}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.totalsWrap}>
            <View style={styles.totalsCard}>
              <View style={styles.totalRow}>
                <Text>Subtotal</Text>
                <Text>${formatMoney(document.subtotal)}</Text>
              </View>
              {document.delivery_fee > 0 ? (
                <View style={styles.totalRow}>
                  <Text>Delivery fee</Text>
                  <Text>${formatMoney(document.delivery_fee)}</Text>
                </View>
              ) : null}
              {document.setup_fee > 0 ? (
                <View style={styles.totalRow}>
                  <Text>Setup fee</Text>
                  <Text>${formatMoney(document.setup_fee)}</Text>
                </View>
              ) : null}
              {document.discount_amount > 0 ? (
                <View style={styles.totalRow}>
                  <Text>Discount</Text>
                  <Text>-${formatMoney(document.discount_amount)}</Text>
                </View>
              ) : null}
              {document.tax_amount > 0 ? (
                <View style={styles.totalRow}>
                  <Text>Tax</Text>
                  <Text>${formatMoney(document.tax_amount)}</Text>
                </View>
              ) : null}
              <View style={[styles.totalRow, styles.totalPrimary]}>
                <Text>{copy.totalLabel}</Text>
                <Text>${formatMoney(document.total_amount)}</Text>
              </View>
              {copy.showDeposit && document.deposit_required > 0 ? (
                <View style={styles.totalRow}>
                  <Text>Deposit required</Text>
                  <Text>${formatMoney(document.deposit_required)}</Text>
                </View>
              ) : null}
              {document.amount_paid > 0 ? (
                <View style={styles.totalRow}>
                  <Text>Amount paid</Text>
                  <Text>${formatMoney(document.amount_paid)}</Text>
                </View>
              ) : null}
              <View style={styles.totalRow}>
                <Text>{copy.balanceLabel}</Text>
                <Text>${formatMoney(document.balance_due)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.notesGrid}>
            <NotesSection title="What’s included" value={document.inclusions} />
            <NotesSection title="Exclusions / assumptions" value={document.exclusions} />
            <NotesSection title="Payment instructions" value={document.payment_instructions} />
            <NotesSection title="Terms" value={document.payment_terms} />
            <NotesSection title="Notes" value={document.notes} />
            {document.payments.length ? (
              <View style={styles.notesCard}>
                <Text style={styles.eyebrow}>Payments received</Text>
                {document.payments.map((payment) => (
                  <View key={payment.id} style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                    <Text>{formatDocumentDate(payment.payment_date)} · ${formatMoney(payment.amount)}</Text>
                    <Text style={styles.muted}>{payment.payment_method || "Payment recorded"}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerBrand}>Elel Events & Design</Text>
            <Text style={styles.muted}>{copy.footer}</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
