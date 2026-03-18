// app/pdf/CN22.tsx
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
    width: 250, // Approx 4x6 label size proportion
  },
  header: { fontSize: 14, fontWeight: "bold", marginBottom: 10, textAlign: "center" },
  checkboxRow: { flexDirection: "row", marginBottom: 10, flexWrap: "wrap" },
  checkbox: { flexDirection: "row", marginRight: 15, marginBottom: 5, alignItems: "center" },
  box: { width: 10, height: 10, border: "1px solid #000", marginRight: 5 },
  filledBox: { width: 10, height: 10, border: "1px solid #000", marginRight: 5, backgroundColor: "#000" },
  tableHeader: { flexDirection: "row", borderBottom: "1px solid #000", paddingBottom: 2, marginBottom: 2, fontSize: 8 },
  tableRow: { flexDirection: "row", marginBottom: 2, fontSize: 8 },
  colDesc: { width: "50%" },
  colWeight: { width: "25%", textAlign: "center" },
  colVal: { width: "25%", textAlign: "right" },
  footerRow: { flexDirection: "row", borderTop: "1px solid #000", paddingTop: 5, marginTop: 5 },
  signatureSection: { marginTop: 10, borderTop: "1px solid #000", paddingTop: 5 },
  smallPrint: { fontSize: 7, marginTop: 5, fontStyle: "italic" },
});

export function CN22Doc({ data }: { data: CommercialInvoiceData }) {
  const totalWeight = data.lineItems.reduce((acc, item) => acc + item.weightGrams, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.formContainer}>
          <Text style={styles.header}>CUSTOMS DECLARATION CN 22</Text>
          <Text style={{ marginBottom: 5 }}>Designated operator</Text>
          
          <View style={styles.checkboxRow}>
            <View style={styles.checkbox}><View style={styles.box}/><Text>Gift</Text></View>
            <View style={styles.checkbox}><View style={styles.box}/><Text>Documents</Text></View>
            <View style={styles.checkbox}><View style={styles.box}/><Text>Commercial sample</Text></View>
            <View style={styles.checkbox}><View style={styles.filledBox}/><Text>Sale of goods</Text></View>
            <View style={styles.checkbox}><View style={styles.box}/><Text>Returned goods</Text></View>
            <View style={styles.checkbox}><View style={styles.box}/><Text>Other</Text></View>
          </View>

          <View style={styles.tableHeader}>
            <Text style={styles.colDesc}>Detailed description of contents</Text>
            <Text style={styles.colWeight}>Weight (g)</Text>
            <Text style={styles.colVal}>Value</Text>
          </View>

          {data.lineItems.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.colDesc}>{item.quantity}x {item.title}</Text>
              <Text style={styles.colWeight}>{Math.round(item.weightGrams)}</Text>
              <Text style={styles.colVal}>{item.totalPrice.toFixed(2)}</Text>
            </View>
          ))}

          <View style={styles.footerRow}>
            <Text style={styles.colDesc}>HS tariff number / Origin</Text>
            <Text style={styles.colWeight}>Total Weight</Text>
            <Text style={styles.colVal}>Total Value</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.colDesc}>Multiple / {data.sellerDetails.country || "US"}</Text>
            <Text style={styles.colWeight}>{Math.round(totalWeight)} g</Text>
            <Text style={styles.colVal}>{data.totalDeclaredValue.toFixed(2)} {data.currency}</Text>
          </View>

          <View style={styles.signatureSection}>
            <Text>I, the undersigned, whose name and address are given on the item, certify that the particulars given in this declaration are correct and that this item does not contain any dangerous article or articles prohibited by legislation or by postal or customs regulations.</Text>
            <Text style={{ marginTop: 10 }}>Date and sender's signature: ______________________</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
