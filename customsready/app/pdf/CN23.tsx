// app/pdf/CN23.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CommercialInvoiceData } from "~/types/customs";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica" },
  formContainer: {
    border: "2px solid #000",
    padding: 10,
    width: "100%", 
  },
  headerRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: "bold" },
  box: { border: "1px solid #000", padding: 5, marginBottom: 5 },
  row: { flexDirection: "row", marginBottom: 5 },
  colHalf: { width: "49%", marginRight: "2%" },
  tableHeader: { flexDirection: "row", borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 2, fontSize: 8 },
  tableRow: { flexDirection: "row", marginBottom: 2, fontSize: 8 },
  colDesc: { width: "40%" },
  colQty: { width: "10%", textAlign: "center" },
  colWeight: { width: "15%", textAlign: "center" },
  colValue: { width: "15%", textAlign: "center" },
  colHs: { width: "10%", textAlign: "center" },
  colOrigin: { width: "10%", textAlign: "center" },
  footerRow: { flexDirection: "row", borderTop: "1px solid #000", paddingTop: 5, marginTop: 5 },
  checkboxRow: { flexDirection: "row", marginBottom: 5, flexWrap: "wrap", fontSize: 8 },
  checkbox: { flexDirection: "row", marginRight: 15, marginBottom: 2, alignItems: "center" },
  cbox: { width: 8, height: 8, border: "1px solid #000", marginRight: 3 },
  filledCbox: { width: 8, height: 8, border: "1px solid #000", marginRight: 3, backgroundColor: "#000" },
});

export function CN23Doc({ data }: { data: CommercialInvoiceData }) {
  const totalWeight = data.lineItems.reduce((acc, item) => acc + item.weightGrams, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.formContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>CUSTOMS DECLARATION CN 23</Text>
            <Text>Designated operator</Text>
          </View>

          <View style={styles.row}>
            <View style={[styles.box, styles.colHalf]}>
              <Text style={{ fontWeight: "bold" }}>From (Sender)</Text>
              <Text>{data.sellerDetails.name || "N/A"}</Text>
              <Text>{data.sellerDetails.address || "N/A"}</Text>
            </View>
            <View style={[styles.box, styles.colHalf, { marginRight: 0 }]}>
              <Text style={{ fontWeight: "bold" }}>To (Receiver)</Text>
              <Text>{data.buyerDetails.name}</Text>
              <Text>{data.buyerDetails.addressLine1}</Text>
              <Text>{data.buyerDetails.city}, {data.buyerDetails.country}</Text>
            </View>
          </View>

          <View style={styles.box}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDesc}>Detailed description of contents</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colWeight}>Net weight (g)</Text>
              <Text style={styles.colValue}>Value</Text>
              <Text style={styles.colHs}>HS tariff</Text>
              <Text style={styles.colOrigin}>Origin</Text>
            </View>

            {data.lineItems.map((item, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colDesc}>{item.title}</Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colWeight}>{Math.round(item.weightGrams)}</Text>
                <Text style={styles.colValue}>{item.totalPrice.toFixed(2)}</Text>
                <Text style={styles.colHs}>{item.hsCode}</Text>
                <Text style={styles.colOrigin}>{item.countryOfOrigin}</Text>
              </View>
            ))}

            <View style={styles.footerRow}>
              <Text style={styles.colDesc}>Totals</Text>
              <Text style={styles.colQty}>-</Text>
              <Text style={styles.colWeight}>{Math.round(totalWeight)}</Text>
              <Text style={styles.colValue}>{data.totalDeclaredValue.toFixed(2)} {data.currency}</Text>
              <Text style={styles.colHs}>-</Text>
              <Text style={styles.colOrigin}>-</Text>
            </View>
          </View>

          <View style={styles.box}>
            <Text style={{ fontWeight: "bold", marginBottom: 5 }}>Category of item</Text>
            <View style={styles.checkboxRow}>
              <View style={styles.checkbox}><View style={styles.cbox}/><Text>Gift</Text></View>
              <View style={styles.checkbox}><View style={styles.cbox}/><Text>Documents</Text></View>
              <View style={styles.checkbox}><View style={styles.cbox}/><Text>Commercial sample</Text></View>
              <View style={styles.checkbox}><View style={styles.filledCbox}/><Text>Sale of goods</Text></View>
              <View style={styles.checkbox}><View style={styles.cbox}/><Text>Returned goods</Text></View>
              <View style={styles.checkbox}><View style={styles.cbox}/><Text>Other</Text></View>
            </View>
          </View>

          <View style={styles.box}>
            <Text>I certify that the particulars given in this customs declaration are correct and that this item does not contain any dangerous article or articles prohibited by legislation or by postal or customs regulations.</Text>
            <Text style={{ marginTop: 15 }}>Date and sender's signature: ___________________________</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
