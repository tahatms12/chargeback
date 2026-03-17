import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useFetcher } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  Text,
  IndexTable,
  Badge,
  Button,
  EmptyState,
  InlineStack,
  useBreakpoints,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "~/shopify.server";

interface DraftOrder {
  id: string;
  name: string;
  customer: string;
  status: string;
  total: string;
  currencyCode: string;
  createdAt: string;
  invoiceUrl: string | null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query getDraftOrders {
        draftOrders(first: 50, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              name
              status
              createdAt
              invoiceUrl
              totalPriceSet {
                shopMoney {
                  amount
                  currencyCode
                }
              }
              customer {
                displayName
                email
              }
            }
          }
        }
      }`
  );

  const data = await response.json();
  const draftOrders: DraftOrder[] =
    data.data?.draftOrders?.edges?.map(
      ({ node }: any): DraftOrder => ({
        id: node.id,
        name: node.name,
        customer:
          node.customer?.displayName ||
          node.customer?.email ||
          "No customer",
        status: node.status,
        total: node.totalPriceSet.shopMoney.amount,
        currencyCode: node.totalPriceSet.shopMoney.currencyCode,
        createdAt: new Date(node.createdAt).toLocaleDateString(),
        invoiceUrl: node.invoiceUrl,
      })
    ) ?? [];

  return json({ draftOrders });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "send_invoice") {
    const draftOrderId = formData.get("draftOrderId") as string;
    await admin.graphql(
      `#graphql
        mutation sendInvoice($id: ID!) {
          draftOrderInvoiceSend(id: $id) {
            userErrors { field message }
          }
        }`,
      { variables: { id: draftOrderId } }
    );
    return json({ ok: true, action: "invoice_sent" });
  }

  if (intent === "delete") {
    const draftOrderId = formData.get("draftOrderId") as string;
    await admin.graphql(
      `#graphql
        mutation deleteDraftOrder($input: DraftOrderDeleteInput!) {
          draftOrderDelete(input: $input) {
            userErrors { field message }
          }
        }`,
      { variables: { input: { id: draftOrderId } } }
    );
    return json({ ok: true, action: "deleted" });
  }

  if (intent === "complete") {
    const draftOrderId = formData.get("draftOrderId") as string;
    await admin.graphql(
      `#graphql
        mutation completeDraftOrder($id: ID!) {
          draftOrderComplete(id: $id) {
            draftOrder { id status }
            userErrors { field message }
          }
        }`,
      { variables: { id: draftOrderId } }
    );
    return json({ ok: true, action: "completed" });
  }

  return json({ ok: false, action: "unknown" });
};

function statusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return <Badge tone="attention">Open</Badge>;
    case "INVOICE_SENT":
      return <Badge tone="info">Invoice Sent</Badge>;
    case "COMPLETED":
      return <Badge tone="success">Completed</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

export default function QuotesDashboard() {
  const { draftOrders } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const { smUp } = useBreakpoints();

  const resourceName = {
    singular: "quote",
    plural: "quotes",
  };

  const rowMarkup = draftOrders.map((order, index) => (
    <IndexTable.Row id={order.id} key={order.id} position={index}>
      <IndexTable.Cell>
        <Text variant="bodyMd" fontWeight="bold" as="span">
          {order.name}
        </Text>
      </IndexTable.Cell>
      <IndexTable.Cell>{order.customer}</IndexTable.Cell>
      <IndexTable.Cell>{statusBadge(order.status)}</IndexTable.Cell>
      <IndexTable.Cell>
        {order.currencyCode} {parseFloat(order.total).toFixed(2)}
      </IndexTable.Cell>
      <IndexTable.Cell>{order.createdAt}</IndexTable.Cell>
      <IndexTable.Cell>
        <InlineStack gap="200">
          {order.status === "OPEN" && (
            <>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="send_invoice" />
                <input type="hidden" name="draftOrderId" value={order.id} />
                <Button size="micro" submit>
                  Send Invoice
                </Button>
              </fetcher.Form>
              <fetcher.Form method="post">
                <input type="hidden" name="intent" value="complete" />
                <input type="hidden" name="draftOrderId" value={order.id} />
                <Button size="micro" tone="success" submit>
                  Complete
                </Button>
              </fetcher.Form>
            </>
          )}
          {order.status !== "COMPLETED" && (
            <fetcher.Form method="post">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="draftOrderId" value={order.id} />
              <Button size="micro" tone="critical" submit>
                Delete
              </Button>
            </fetcher.Form>
          )}
        </InlineStack>
      </IndexTable.Cell>
    </IndexTable.Row>
  ));

  return (
    <Page>
      <TitleBar title="QuoteLoop — Draft Orders & Quotes" />
      <Layout>
        <Layout.Section>
          <BlockStack gap="400">
            <Card>
              <BlockStack gap="200">
                <Text as="h2" variant="headingMd">
                  Quote Management
                </Text>
                <Text as="p" tone="subdued">
                  View, send invoices, and manage draft orders as quotes for
                  your customers.
                </Text>
              </BlockStack>
            </Card>

            {draftOrders.length === 0 ? (
              <Card>
                <EmptyState
                  heading="No quotes yet"
                  image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                >
                  <p>
                    Create a draft order in your Shopify admin to get started.
                    Draft orders will appear here as quotes that you can manage
                    and send to customers.
                  </p>
                </EmptyState>
              </Card>
            ) : (
              <Card padding="0">
                <IndexTable
                  condensed={!smUp}
                  resourceName={resourceName}
                  itemCount={draftOrders.length}
                  headings={[
                    { title: "Quote #" },
                    { title: "Customer" },
                    { title: "Status" },
                    { title: "Total" },
                    { title: "Created" },
                    { title: "Actions" },
                  ]}
                  selectable={false}
                >
                  {rowMarkup}
                </IndexTable>
              </Card>
            )}
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
