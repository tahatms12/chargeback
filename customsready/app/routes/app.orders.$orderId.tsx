import { json, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  Text,
  BlockStack,
  InlineStack,
  Button,
  DataTable,
  Box,
  Divider
} from "@shopify/polaris";
import { authenticate } from "~/shopify.server";
import { fetchAndMapOrder } from "~/lib/orderMapper";

export async function loader({ request, params }: LoaderFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const orderId = params.orderId;
  
  if (!orderId) {
    throw new Response("Missing order ID", { status: 400 });
  }

  const invoiceData = await fetchAndMapOrder(admin, orderId);
  return json({ orderId, invoiceData });
}

export default function OrderDetails() {
  const { orderId, invoiceData } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<any>();
  
  const calculateDuties = () => {
    fetcher.submit(
      { 
        destinationCountry: invoiceData.buyerDetails.country,
        totalValue: invoiceData.totalDeclaredValue,
        currency: invoiceData.currency,
        hsCode: invoiceData.lineItems[0]?.hsCode || ""
      },
      { method: "POST", action: "/app/api/duties", encType: "application/json" }
    );
  };

  const dutyEstimate = fetcher.data?.estimate;

  const rows = invoiceData.lineItems.map((item: any) => [
    item.title,
    item.quantity.toString(),
    item.hsCode || "Missing",
    item.countryOfOrigin,
    `${item.totalPrice.toFixed(2)} ${invoiceData.currency}`
  ]);

  return (
    <Page
      backAction={{ content: "Orders", url: "/app" }}
      title={`Order ${invoiceData.orderId}`}
      primaryAction={{
        content: "Commercial Invoice",
        onAction: () => window.open(`/app/api/invoice/${orderId}`, '_blank')
      }}
      secondaryActions={[
        {
          content: "Customs Form (CN22/CN23)",
          onAction: () => window.open(`/app/api/cn-form/${orderId}`, '_blank')
        }
      ]}
    >
      <Layout>
        <Layout.Section>
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Line Items (Customs Info)</Text>
              <DataTable
                columnContentTypes={["text", "numeric", "text", "text", "numeric"]}
                headings={["Item", "Qty", "HS Code", "Origin", "Total"]}
                rows={rows}
              />
            </BlockStack>
          </Card>
          
          <Box paddingBlockStart="400">
            <Card>
              <BlockStack gap="400">
                <Text as="h2" variant="headingMd">Duty & Tax Estimation</Text>
                <Text as="p">
                  Destination: {invoiceData.buyerDetails.country} | 
                  Declared Value: {invoiceData.totalDeclaredValue.toFixed(2)} {invoiceData.currency}
                </Text>
                
                <InlineStack align="start">
                  <Button onClick={calculateDuties} loading={fetcher.state !== "idle"}>Calculate Estimated Duties</Button>
                </InlineStack>
                
                {dutyEstimate && (
                  <BlockStack gap="200">
                    <Divider />
                    <InlineStack align="space-between">
                      <Text as="span">Estimated Duties:</Text>
                      <Text as="span" fontWeight="bold">{(dutyEstimate.dutiesAmount || 0).toFixed(2)} USD</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span">Estimated Taxes (VAT/GST):</Text>
                      <Text as="span" fontWeight="bold">{(dutyEstimate.taxesAmount || 0).toFixed(2)} USD</Text>
                    </InlineStack>
                    <InlineStack align="space-between">
                      <Text as="span">Total Customs Estimate:</Text>
                      <Text as="span" fontWeight="bold" tone="success">{(dutyEstimate.totalCustomsAmount || 0).toFixed(2)} USD</Text>
                    </InlineStack>
                  </BlockStack>
                )}
              </BlockStack>
            </Card>
          </Box>
        </Layout.Section>
        
        <Layout.Section variant="oneThird">
          <Card>
            <BlockStack gap="400">
              <Text as="h2" variant="headingMd">Destination Address</Text>
              <Text as="p">{invoiceData.buyerDetails.name}</Text>
              <Text as="p">{invoiceData.buyerDetails.addressLine1}</Text>
              {invoiceData.buyerDetails.addressLine2 && <Text as="p">{invoiceData.buyerDetails.addressLine2}</Text>}
              <Text as="p">{invoiceData.buyerDetails.city}, {invoiceData.buyerDetails.province} {invoiceData.buyerDetails.zip}</Text>
              <Text as="p">{invoiceData.buyerDetails.country}</Text>
            </BlockStack>
          </Card>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
