import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { QuoteLine } from "@mercurius/domain";
import type { QuotePdfData } from "./types";

const colors = { ink: "#17211b", muted: "#617067", green: "#164f3b", pale: "#edf5f0", gold: "#c7963f", border: "#dce4df", warning: "#fff7e6" };
const styles = StyleSheet.create({
  page: { paddingTop: 38, paddingBottom: 52, paddingHorizontal: 42, fontFamily: "Helvetica", fontSize: 9, color: colors.ink },
  header: { backgroundColor: colors.green, marginHorizontal: -42, marginTop: -38, paddingHorizontal: 42, paddingVertical: 26, color: "#ffffff" },
  brand: { fontSize: 8, letterSpacing: 2.2, textTransform: "uppercase", color: "#c9ddd3" },
  title: { fontSize: 25, fontFamily: "Helvetica-Bold", marginTop: 7 },
  subtitle: { fontSize: 10, marginTop: 6, color: "#dcebe4" },
  context: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 18 },
  contextColumn: { width: "48%" }, label: { fontSize: 7, letterSpacing: 1.2, textTransform: "uppercase", color: colors.muted, marginBottom: 4 },
  contextValue: { fontSize: 13, fontFamily: "Helvetica-Bold" }, contextSub: { fontSize: 8, color: colors.muted, marginTop: 3 },
  section: { marginTop: 20 }, sectionTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", color: colors.green, marginBottom: 9 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f1f4f2", borderTopLeftRadius: 4, borderTopRightRadius: 4, paddingVertical: 7, paddingHorizontal: 8 },
  tableRow: { flexDirection: "row", paddingVertical: 9, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  productCell: { width: "34%", paddingRight: 8 }, setupCell: { width: "14%", textAlign: "right" }, monthlyCell: { width: "16%", textAlign: "right" }, discountCell: { width: "13%", textAlign: "right" }, finalCell: { width: "23%", textAlign: "right" },
  productName: { fontFamily: "Helvetica-Bold", fontSize: 9 }, productType: { color: colors.muted, fontSize: 7, marginTop: 2, textTransform: "capitalize" },
  explanation: { marginTop: 5, padding: 7, backgroundColor: "#f7f9f8", color: colors.muted, fontSize: 7.5, lineHeight: 1.35 },
  totalsRow: { flexDirection: "row", gap: 10 }, totalCard: { flexGrow: 1, backgroundColor: colors.pale, padding: 13, borderRadius: 5 }, totalLabel: { fontSize: 8, color: colors.muted }, totalValue: { fontSize: 18, fontFamily: "Helvetica-Bold", color: colors.green, marginTop: 5 },
  earnings: { backgroundColor: colors.green, color: "#ffffff", borderRadius: 5, padding: 15 }, earningsTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 10 }, earningsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }, earningsLabel: { color: "#d5e5dd" }, earningsValue: { fontFamily: "Helvetica-Bold" }, year: { borderTopWidth: 1, borderTopColor: "#4d7564", marginTop: 5, paddingTop: 8 },
  warning: { backgroundColor: colors.warning, borderLeftWidth: 3, borderLeftColor: colors.gold, padding: 10, marginTop: 8 }, warningTitle: { fontFamily: "Helvetica-Bold", marginBottom: 3 },
  audit: { marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, color: colors.muted, fontSize: 7, lineHeight: 1.5 },
  hash: { fontFamily: "Courier", fontSize: 6.5 }, footer: { position: "absolute", bottom: 22, left: 42, right: 42, flexDirection: "row", justifyContent: "space-between", color: colors.muted, fontSize: 7 },
});

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const dollars = (value: number) => currency.format(value / 100);
const percent = (value: number) => value === 0 ? "-" : `${(value / 100).toFixed(value % 100 === 0 ? 0 : 2)}%`;
const typeLabel = (line: QuoteLine) => line.kind === "core" ? "Core package" : line.classification.replace("_", " ");

export function QuoteDocument({ data }: { data: QuotePdfData }) {
  const { calculation, rep } = data;
  const date = new Intl.DateTimeFormat("en-US", { year: "numeric", month: "long", day: "numeric" }).format(new Date(data.generatedAt));
  return <Document title={`Mercurius Quote - ${data.vendorName}`} author="Mercurius Solutions" subject={`Quote ${data.quoteId ?? calculation.calculationHash}`}>
    <Page size="LETTER" style={styles.page} wrap>
      <View style={styles.header}><Text style={styles.brand}>MERCURIUS SOLUTIONS</Text><Text style={styles.title}>Vendor Growth Proposal</Text><Text style={styles.subtitle}>Clear pricing. Accountable outcomes. Built for long-term growth.</Text></View>
      <View style={styles.context}>
        <View style={styles.contextColumn}><Text style={styles.label}>Prepared for</Text><Text style={styles.contextValue}>{data.vendorName}</Text><Text style={styles.contextSub}>{date}</Text></View>
        <View style={styles.contextColumn}><Text style={styles.label}>Prepared by</Text><Text style={styles.contextValue}>{rep.name}</Text><Text style={styles.contextSub}>{[rep.email, rep.phone].filter(Boolean).join("  |  ")}</Text></View>
      </View>

      <View style={styles.section}><Text style={styles.sectionTitle}>Your solution</Text>
        <View style={styles.tableHeader}><Text style={styles.productCell}>PACKAGE</Text><Text style={styles.setupCell}>SETUP</Text><Text style={styles.monthlyCell}>LIST / MO</Text><Text style={styles.discountCell}>DISCOUNT</Text><Text style={styles.finalCell}>FINAL / MO</Text></View>
        {calculation.lines.map((line) => <View key={`${line.kind}-${line.productCode}`} style={styles.tableRow} wrap={false}>
          <View style={styles.productCell}><Text style={styles.productName}>{line.productName}</Text><Text style={styles.productType}>{typeLabel(line)}</Text><Text style={styles.explanation}>{line.explanation}</Text></View>
          <Text style={styles.setupCell}>{dollars(line.finalSetupCents)}</Text><Text style={styles.monthlyCell}>{dollars(line.listMonthlyCents)}</Text><Text style={styles.discountCell}>{percent(line.appliedDiscountBps)}</Text><Text style={styles.finalCell}>{dollars(line.finalMonthlyCents)}</Text>
        </View>)}
      </View>

      <View style={styles.section} wrap={false}><Text style={styles.sectionTitle}>Vendor investment</Text><View style={styles.totalsRow}><View style={styles.totalCard}><Text style={styles.totalLabel}>ONE-TIME TOTAL</Text><Text style={styles.totalValue}>{dollars(calculation.totals.setupCents)}</Text></View><View style={styles.totalCard}><Text style={styles.totalLabel}>MONTHLY TOTAL</Text><Text style={styles.totalValue}>{dollars(calculation.totals.monthlyCents)}</Text></View></View></View>
      <View style={styles.section} wrap={false}><View style={styles.earnings}><Text style={styles.earningsTitle}>Rep earnings summary</Text><View style={styles.earningsRow}><Text style={styles.earningsLabel}>Upfront commission</Text><Text style={styles.earningsValue}>{dollars(calculation.totals.upfrontCommissionCents)}</Text></View><View style={styles.earningsRow}><Text style={styles.earningsLabel}>Monthly residual (starts Month 2)</Text><Text style={styles.earningsValue}>{dollars(calculation.totals.monthlyResidualCents)}</Text></View><View style={[styles.earningsRow, styles.year]}><Text>Year-1 estimate</Text><Text style={styles.earningsValue}>{dollars(calculation.totals.yearOneEarningsCents)}</Text></View></View></View>

      {calculation.warnings.filter((warning) => warning.code !== "RESIDUAL_STARTS_MONTH_2").map((warning) => <View key={warning.code} style={styles.warning} wrap={false}><Text style={styles.warningTitle}>Quote note</Text><Text>{warning.message}</Text></View>)}
      <View style={styles.audit}><Text>Catalog version: {calculation.catalogVersion}  |  Engine: {calculation.engineVersion}</Text><Text>Quote ID: {data.quoteId ?? "CURRENT PREVIEW - NOT YET SAVED"}</Text><Text style={styles.hash}>Calculation hash: {calculation.calculationHash}</Text></View>
      <View style={styles.footer} fixed><Text>Mercurius Solutions - Confidential</Text><Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} /></View>
    </Page>
  </Document>;
}
