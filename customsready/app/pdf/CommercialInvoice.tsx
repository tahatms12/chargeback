// app/pdf/CommercialInvoice.tsx
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { CommercialInvoiceData } from "~/types/customs";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { fontSize: 20, marginBottom: 20, textAlign: "center", fontWeight: "bold" },
  section: { marginBottom: 15 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", marginBottom: 5, borderBottom: "1px solid #ccc", paddingBottom: 2 },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 3 },
  tableHeader: { flexDirection: "row", borderBottom: "1px solid #000", paddingBottom: 5, marginBottom: 5, fontWeight: "bold" },
  tableRow: { flexDirection: "row", marginBottom: 4 },
  col1: { width: "40%" },
  col2: { width: "10%", textAlign: "center" },
  col3: { width: "15%", textAlign: "center" },
  col4: { width: "20%", textAlign: "center" },
  col5: { width: "15%", textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10, paddingTop: 5, borderTop: "1px solid #000", fontWeight: "bold" },
  sellerBuyer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  box: { width: "48%", border: "1px solid #ccc", padding: 10 },
  declaration: { marginTop: 30, fontSize: 9, fontStyle: "italic", textAlign: "justify" },
});

export function CommercialInvoiceDoc({ data }: { data: CommercialInvoiceData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.header}>COMMERCIAL INVOICE</Text>
        
        <View style={styles.row}>
          <Text>Invoice Number: {data.orderName}-CI</Text>
          <Text>Date: {data.orderDate}</Text>
        </View>
        <View style={styles.row}>
          <Text>Order ID: {data.orderId.split("/").pop()}</Text>
          <Text>Currency: {data.currency}</Text>
        </View>

        <View style={styles.sellerBuyer}>
          <View style={styles.box}>
            <Text style={styles.sectionTitle}>Shipper / Seller</Text>
            <Text>{data.sellerDetails.name || "N/A"}</Text>
            <Text>{data.sellerDetails.address || "N/A"}</Text>
            {data.sellerDetails.email && <Text>{data.sellerDetails.email}</Text>}
            {data.sellerDetails.phone && <Text>{data.sellerDetails.phone}</Text>}
          </View>
          <View style={styles.box}>
            <Text style={styles.sectionTitle}>Consignee / Buyer</Text>
            <Text>{data.buyerDetails.name}</Text>
            <Text>{data.buyerDetails.addressLine1}</Text>
            {data.buyerDetails.addressLine2 && <Text>{data.buyerDetails.addressLine2}</Text>}
            <Text>
              {data.buyerDetails.city}, {data.buyerDetails.province || ""} {data.buyerDetails.zip}
            </Text>
            <Text>{data.buyerDetails.country}</Text>
            {data.buyerDetails.email && <Text>{data.buyerDetails.email}</Text>}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Line Items</Text>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Qty</Text>
            <Text style={styles.col3}>HS Code</Text>
            <Text style={styles.col4}>Origin</Text>
            <Text style={styles.col5}>Total Value</Text>
          </View>
          {data.lineItems.map((item, idx) => (
            <View key={idx} style={styles.tableRow}>
              <Text style={styles.col1}>{item.title}</Text>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{item.hsCode}</Text>
              <Text style={styles.col4}>{item.countryOfOrigin}</Text>
              <Text style={styles.col5}>
                {item.totalPrice.toFixed(2)} {data.currency}
              </Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text>Grand Total: </Text>
            <Text>{data.totalDeclaredValue.toFixed(2)} {data.currency}</Text>
          </View>
        </View>

        <View style={styles.declaration}>
          <Text>
            These commodities, technology, or software were exported from the 
            United States in accordance with the Export Administration Regulations. 
            Diversion contrary to U.S. law is prohibited. I declare that all the 
            information contained in this invoice to be true and correct.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
