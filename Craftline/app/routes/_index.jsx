import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useSubmit,
  useNavigation,
  useFetcher,
} from "@remix-run/react";
import {
  Page,
  Layout,
  Banner,
  Button,
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Spinner,
  EmptyState,
  Modal,
  ResourceList,
  ResourceItem,
  Thumbnail,
  Checkbox,
  Select,
  Divider,
  Card,
} from "@shopify/polaris";
import { useState, useCallback } from "react";
import { authenticate } from "../shopify.server.js";
import { getStages } from "../lib/stages.server.js";
import {
  getQueueByStage,
  getActiveOrderCount,
  addOrderToQueue,
  buildProductSummary,
} from "../lib/orders.server.js";
import { checkBillingAccess, createSubscription } from "../lib/billing.server.js";
import { FREE_TIER_ORDER_LIMIT } from "../constants.js";
const OPEN_ORDERS_QUERY = `
  query GetOpenOrders($cursor: String) {
    orders(
      first: 50
      after: $cursor
      sortKey: CREATED_AT
      reverse: true
      query: "status:open fulfillment_status:unshipped OR status:open fulfillment_status:partial"
    ) {
      edges {
        node {
          id
          name
          email
          customer {
            firstName
            lastName
            email
          }
          lineItems(first: 5) {
            edges {
              node {
                title
                quantity
              }
            }
          }
          createdAt
          tags
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;

  const [stages, queueByStage, activeOrderCount] = await Promise.all([
    getStages(shop),
    getQueueByStage(shop),
    getActiveOrderCount(shop),
  ]);

  // Fetch open Shopify orders for the "Add to Queue" modal
  let shopifyOrders = [];
  try {
    const resp = await admin.graphql(OPEN_ORDERS_QUERY);
    const data = await resp.json();
    shopifyOrders = (data?.data?.orders?.edges ?? []).map(({ node }) => ({
      id: node.id,
      name: node.name,
      email: node.email ?? node.customer?.email ?? null,
      customerName: node.customer
        ? `${node.customer.firstName ?? ""} ${node.customer.lastName ?? ""}`.trim()
        : null,
      productSummary: buildProductSummary(
        node.lineItems.edges.map((e) => e.node)
      ),
      createdAt: node.createdAt,
    }));
  } catch (err) {
    console.error("Failed to fetch Shopify orders:", err.message);
  }

  // Filter out orders already in the queue
  const queuedOrderIds = new Set(
    Object.values(queueByStage).flat().map((o) => o.orderId)
  );
  const unqueuedOrders = shopifyOrders.filter((o) => !queuedOrderIds.has(o.id));

  const billing = await checkBillingAccess(admin, activeOrderCount);

  return json({
    stages,
    queueByStage,
    activeOrderCount,
    unqueuedOrders,
    billing,
    shop,
  });
};

export const action = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "add_to_queue") {
    const selectedOrderIds = formData.getAll("orderIds");
    const initialStageId = formData.get("stageId") || null;

    // Fetch order details for selected orders
    let stageName = null;
    if (initialStageId) {
      const { getStage } = await import("../lib/stages.server.js");
      const stage = await getStage(shop, initialStageId);
      stageName = stage?.name ?? null;
    }

    // We need order data — re-fetch just the selected orders
    const idsQuery = selectedOrderIds
      .map((gid) => {
        const numericId = gid.replace("gid://shopify/Order/", "");
        return `id:${numericId}`;
      })
      .join(" OR ");

    if (idsQuery) {
      const resp = await admin.graphql(`
        query GetSelectedOrders {
          orders(first: 50, query: "${idsQuery}") {
            edges {
              node {
                id
                name
                email
                customer { firstName lastName email }
                lineItems(first: 5) { edges { node { title quantity } } }
              }
            }
          }
        }
      `);
      const data = await resp.json();
      const orders = data?.data?.orders?.edges ?? [];

      for (const { node } of orders) {
        await addOrderToQueue(
          shop,
          {
            orderId: node.id,
            orderName: node.name,
            customerEmail: node.email ?? node.customer?.email ?? null,
            customerName: node.customer
              ? `${node.customer.firstName ?? ""} ${node.customer.lastName ?? ""}`.trim()
              : null,
            productSummary: buildProductSummary(
              node.lineItems.edges.map((e) => e.node)
            ),
          },
          initialStageId,
          stageName
        );
      }
    }

    return json({ ok: true });
  }

  if (intent === "upgrade") {
    const returnUrl = `${process.env.SHOPIFY_APP_URL}/app`;
    const confirmationUrl = await createSubscription(admin, returnUrl);
    return redirect(confirmationUrl);
  }

  return json({ ok: false, error: "Unknown intent" }, { status: 400 });
};

export default function QueueDashboard() {
  const { stages, queueByStage, activeOrderCount, unqueuedOrders, billing } =
    useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isSubmitting = navigation.state !== "idle";

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [initialStageId, setInitialStageId] = useState(
    stages[0]?.id ?? ""
  );

  const handleAddToQueue = useCallback(() => {
    if (!selectedOrderIds.length) return;
    const fd = new FormData();
    fd.set("intent", "add_to_queue");
    selectedOrderIds.forEach((id) => fd.append("orderIds", id));
    fd.set("stageId", initialStageId);
    submit(fd, { method: "post" });
    setAddModalOpen(false);
    setSelectedOrderIds([]);
  }, [selectedOrderIds, initialStageId, submit]);

  const stageOptions = [
    { label: "— Unassigned —", value: "" },
    ...stages.map((s) => ({ label: s.name, value: s.id })),
  ];

  const totalInQueue = Object.values(queueByStage).flat().length;

  return (
    <Page
      title="Production Queue"
      subtitle={`${totalInQueue} order${totalInQueue !== 1 ? "s" : ""} in queue`}
      primaryAction={
        <Button
          variant="primary"
          onClick={() => setAddModalOpen(true)}
          disabled={unqueuedOrders.length === 0}
        >
          Add Orders to Queue
        </Button>
      }
    >
      <BlockStack gap="400">
        {/* Billing gate banner */}
        {!billing.allowed && (
          <Banner
            title={`Free tier limit reached (${FREE_TIER_ORDER_LIMIT} orders)`}
            tone="warning"
            action={{
              content: "Upgrade — $9/month",
              onAction: () => {
                const fd = new FormData();
                fd.set("intent", "upgrade");
                submit(fd, { method: "post" });
              },
            }}
          >
            <p>
              You have {activeOrderCount} orders in your queue. The free plan
              includes up to {FREE_TIER_ORDER_LIMIT}. Upgrade for unlimited orders.
            </p>
          </Banner>
        )}

        {billing.onFreeTier && (
          <Banner tone="info" title={`Free plan: ${activeOrderCount} / ${FREE_TIER_ORDER_LIMIT} orders used`}>
            <p>Upgrade to $9/month for unlimited orders.</p>
          </Banner>
        )}

        {isSubmitting && (
          <InlineStack align="center">
            <Spinner size="small" />
          </InlineStack>
        )}

        {/* Unassigned bucket */}
        {queueByStage["unassigned"]?.length > 0 && (
          <StageSection
            title="Unassigned"
            orders={queueByStage["unassigned"] ?? []}
            stages={stages}
            tone="subdued"
          />
        )}

        {/* Stage columns */}
        {stages.length === 0 && (
          <EmptyState
            heading="No stages defined"
            action={{ content: "Set up stages", url: "/app/stages" }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Set up your production stages first, then add orders to the queue.</p>
          </EmptyState>
        )}

        {stages.map((stage) => (
          <StageSection
            key={stage.id}
            title={stage.name}
            orders={queueByStage[stage.id] ?? []}
            stages={stages}
          />
        ))}
      </BlockStack>

      {/* Add to Queue modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title={`Add orders to queue (${unqueuedOrders.length} available)`}
        primaryAction={{
          content: `Add ${selectedOrderIds.length} order${selectedOrderIds.length !== 1 ? "s" : ""}`,
          onAction: handleAddToQueue,
          disabled: selectedOrderIds.length === 0,
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setAddModalOpen(false) },
        ]}
        size="large"
      >
        <Modal.Section>
          <BlockStack gap="300">
            <Select
              label="Assign to stage"
              options={stageOptions}
              value={initialStageId}
              onChange={setInitialStageId}
            />
            <Divider />
            {unqueuedOrders.length === 0 ? (
              <Text tone="subdued">All open orders are already in the queue.</Text>
            ) : (
              <ResourceList
                resourceName={{ singular: "order", plural: "orders" }}
                items={unqueuedOrders}
                selectedItems={selectedOrderIds}
                onSelectionChange={setSelectedOrderIds}
                selectable
                renderItem={(order) => (
                  <ResourceItem
                    id={order.id}
                    name={order.name}
                  >
                    <BlockStack gap="100">
                      <Text variant="bodyMd" fontWeight="semibold">
                        {order.name}
                      </Text>
                      {order.customerName && (
                        <Text variant="bodySm" tone="subdued">
                          {order.customerName}
                          {order.email ? ` · ${order.email}` : ""}
                        </Text>
                      )}
                      {order.productSummary && (
                        <Text variant="bodySm" tone="subdued">
                          {order.productSummary}
                        </Text>
                      )}
                    </BlockStack>
                  </ResourceItem>
                )}
              />
            )}
          </BlockStack>
        </Modal.Section>
      </Modal>
    </Page>
  );
}

/**
 * Renders a single stage section with its orders.
 */
function StageSection({ title, orders, stages, tone }) {
  const count = orders.length;

  return (
    <Card>
      <BlockStack gap="300">
        <InlineStack align="space-between" blockAlign="center">
          <InlineStack gap="200" blockAlign="center">
            <Text variant="headingMd" as="h3">
              {title}
            </Text>
            <Badge tone={tone ?? "info"}>{String(count)}</Badge>
          </InlineStack>
        </InlineStack>

        {count === 0 ? (
          <Text tone="subdued" variant="bodySm">
            No orders in this stage.
          </Text>
        ) : (
          <BlockStack gap="200">
            {orders.map((order) => (
              <OrderCard key={order.id} order={order} stages={stages} />
            ))}
          </BlockStack>
        )}
      </BlockStack>
    </Card>
  );
}
