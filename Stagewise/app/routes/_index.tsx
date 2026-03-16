// app/routes/app._index.tsx
// Production queue dashboard — the primary view.
//
// Source requirements:
//   - Show all active orders grouped by production stage
//   - Batch select orders and move to a new stage
//   - Show unassigned (new) open Shopify orders
//   - Mobile-responsive
//   - Free tier banner when approaching/at limit
//
// Implementation choice: list view with checkbox batch selection (not kanban
// drag-and-drop). Rationale: mobile-first requirement + source ambiguity on
// preferred interaction pattern. A list is more touch-friendly.

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useFetcher,
  useLoaderData,
  useNavigation,
  useRevalidator,
} from "@remix-run/react";
import {
  Badge,
  Banner,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  EmptyState,
  InlineStack,
  Layout,
  Page,
  ResourceItem,
  ResourceList,
  Select,
  Spinner,
  Text,
  BlockStack,
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";
import { authenticate } from "../shopify.server";
import { FREE_ORDER_LIMIT, MONTHLY_PLAN } from "../constants";
import { db } from "../db.server";
import { billingStatus } from "../billing.server";

// Shopify GraphQL query: fetch open orders not yet fulfilled
const OPEN_ORDERS_QUERY = `#graphql
  query OpenOrders($cursor: String) {
    orders(first: 50, after: $cursor, query: "status:open fulfillment_status:unfulfilled") {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          createdAt
          customer {
            displayName
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
          tags
        }
      }
    }
  }
`;

interface ShopifyOrder {
  id: string;
  name: string;
  createdAt: string;
  customer: { displayName: string; email: string } | null;
  lineItems: { edges: { node: { title: string; quantity: number } }[] };
  tags: string[];
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session, billing } = await authenticate.admin(request);
  const shopDomain = session.shop;

  // Fetch billing state
  let hasActiveSub = false;
  try {
    const billingCheck = await billing.check({
      plans: [MONTHLY_PLAN],
      isTest: process.env.BILLING_TEST_MODE === "true",
    });
    hasActiveSub = billingCheck.hasActivePayment;
  } catch {
    // Billing check failure is non-fatal — allow app to function
  }

  const billing_status = await billingStatus(shopDomain, hasActiveSub);

  // Load production stages for this store
  const stages = await db.productionStage.findMany({
    where: { shopDomain },
    orderBy: { position: "asc" },
  });

  // Load current order-stage assignments
  const orderStages = await db.orderStage.findMany({
    where: { shopDomain },
    include: { stage: true },
  });

  // Fetch open orders from Shopify (up to 50 — sufficient for the target
  // user segment of 10–100 orders/month)
  let shopifyOrders: ShopifyOrder[] = [];
  try {
    const response = await admin.graphql(OPEN_ORDERS_QUERY);
    const data = await response.json();
    shopifyOrders = data.data?.orders?.edges?.map(
      (e: { node: ShopifyOrder }) => e.node
    ) ?? [];
  } catch (err) {
    console.error("[queue] Failed to fetch Shopify orders:", err);
  }

  // Identify unassigned orders (in Shopify but not in any stage)
  const assignedOrderIds = new Set(orderStages.map((os) => os.orderId));
  const unassignedOrders = shopifyOrders.filter(
    (o) => !assignedOrderIds.has(o.id)
  );

  return json({
    stages,
    orderStages,
    unassignedOrders,
    billing: billing_status,
    shopDomain,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, billing } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const form = await request.formData();
  const intent = form.get("intent") as string;

  if (intent === "upgrade") {
    // Redirect to Shopify billing confirmation
    const response = await billing.request({
      plan: MONTHLY_PLAN,
      isTest: process.env.BILLING_TEST_MODE === "true",
      returnUrl: `${process.env.SHOPIFY_APP_URL}/app`,
    });
    return json({ confirmationUrl: response.confirmationUrl });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
};

// ─── Helper: format a Shopify GID to a numeric ID for the admin URL ──────────
function gidToId(gid: string): string {
  return gid.split("/").pop() ?? gid;
}

// ─── Helper: relative time display ────────────────────────────────────────────
function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return "< 1 hour ago";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

type Stage = {
  id: string;
  name: string;
  color: string;
  position: number;
};

type OrderStageRecord = {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string | null;
  itemSummary: string | null;
  movedAt: string;
  stage: Stage;
};

export default function QueueDashboard() {
  const { stages, orderStages, unassignedOrders, billing } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const stageMover = useFetcher<{ error?: string }>();
  const { revalidate } = useRevalidator();
  const navigation = useNavigation();
  const isLoading = navigation.state === "loading";

  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(
    new Set()
  );
  const [targetStageId, setTargetStageId] = useState("");

  // Auto-select first stage as default move target
  useEffect(() => {
    if (stages.length > 0 && !targetStageId) {
      setTargetStageId(stages[0].id);
    }
  }, [stages, targetStageId]);

  // Revalidate after a successful move
  useEffect(() => {
    if (stageMover.state === "idle" && stageMover.data && !stageMover.data.error) {
      setSelectedOrderIds(new Set());
      revalidate();
    }
  }, [stageMover.state, stageMover.data, revalidate]);

  const toggleOrder = useCallback((orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  }, []);

  const handleBatchMove = useCallback(() => {
    if (!targetStageId || selectedOrderIds.size === 0) return;
    // Collect order details for selected IDs across assigned and unassigned
    const assignedMap = new Map(
      (orderStages as OrderStageRecord[]).map((os) => [os.orderId, os])
    );
    const unassignedMap = new Map(
      (unassignedOrders as ShopifyOrder[]).map((o) => [o.id, o])
    );

    const moves: Array<{
      orderId: string;
      orderNumber: string;
      customerEmail: string;
      customerName: string;
      itemSummary: string;
    }> = [];

    for (const orderId of selectedOrderIds) {
      const assigned = assignedMap.get(orderId);
      if (assigned) {
        moves.push({
          orderId,
          orderNumber: assigned.orderNumber,
          customerEmail: assigned.customerEmail ?? "",
          customerName: assigned.customerName ?? "",
          itemSummary: assigned.itemSummary ?? "",
        });
      } else {
        const unassigned = unassignedMap.get(orderId);
        if (unassigned) {
          const items = unassigned.lineItems.edges
            .map((e) => `${e.node.title} ×${e.node.quantity}`)
            .join(", ");
          moves.push({
            orderId,
            orderNumber: unassigned.name,
            customerEmail: unassigned.customer?.email ?? "",
            customerName: unassigned.customer?.displayName ?? "",
            itemSummary: items,
          });
        }
      }
    }

    stageMover.submit(
      {
        intent: "batchMove",
        stageId: targetStageId,
        moves: JSON.stringify(moves),
      },
      { method: "POST", action: "/api/orders/stage" }
    );
  }, [targetStageId, selectedOrderIds, orderStages, unassignedOrders, stageMover]);

  const handleUpgrade = useCallback(() => {
    fetcher.submit({ intent: "upgrade" }, { method: "POST" });
  }, [fetcher]);

  // Redirect to billing confirmation URL if returned
  useEffect(() => {
    if (fetcher.data && "confirmationUrl" in fetcher.data) {
      window.location.href = (fetcher.data as { confirmationUrl: string }).confirmationUrl;
    }
  }, [fetcher.data]);

  const stageOptions = stages.map((s: Stage) => ({
    label: s.name,
    value: s.id,
  }));

  // Group assigned orders by stage
  const ordersByStage = new Map<string, OrderStageRecord[]>();
  for (const stage of stages as Stage[]) {
    ordersByStage.set(stage.id, []);
  }
  for (const os of orderStages as OrderStageRecord[]) {
    const arr = ordersByStage.get(os.stage.id) ?? [];
    arr.push(os);
    ordersByStage.set(os.stage.id, arr);
  }

  const totalActiveOrders = (orderStages as OrderStageRecord[]).length;
  const hasAnyOrders =
    totalActiveOrders > 0 || (unassignedOrders as ShopifyOrder[]).length > 0;

  return (
    <Page
      title="Production Queue"
      subtitle={`${totalActiveOrders} order${totalActiveOrders !== 1 ? "s" : ""} in queue`}
    >
      <Layout>
        {/* Billing banner */}
        {billing.required && (
          <Layout.Section>
            <Banner
              title={`Free tier limit reached (${FREE_ORDER_LIMIT} orders)`}
              tone="warning"
              action={{
                content: "Upgrade — $9/month",
                loading: fetcher.state === "submitting",
                onAction: handleUpgrade,
              }}
            >
              <p>
                You have {billing.activeOrderCount} active orders. Upgrade to
                track unlimited orders.
              </p>
            </Banner>
          </Layout.Section>
        )}

        {billing.atLimit && !billing.required && !billing.subscribed && (
          <Layout.Section>
            <Banner tone="info" title="Approaching free tier limit">
              <p>
                {billing.activeOrderCount} of {FREE_ORDER_LIMIT} free orders in
                use. Upgrade to unlock unlimited tracking.
              </p>
            </Banner>
          </Layout.Section>
        )}

        {/* Batch move toolbar */}
        {hasAnyOrders && (
          <Layout.Section>
            <Card>
              <InlineStack gap="300" align="start" blockAlign="center" wrap>
                <Text as="span" variant="bodyMd">
                  {selectedOrderIds.size > 0
                    ? `${selectedOrderIds.size} selected`
                    : "Select orders to move"}
                </Text>
                {selectedOrderIds.size > 0 && (
                  <>
                    <Select
                      label="Move to stage"
                      labelInline
                      options={stageOptions}
                      value={targetStageId}
                      onChange={setTargetStageId}
                    />
                    <Button
                      variant="primary"
                      onClick={handleBatchMove}
                      loading={stageMover.state === "submitting"}
                      disabled={!targetStageId}
                    >
                      Move {selectedOrderIds.size} order
                      {selectedOrderIds.size !== 1 ? "s" : ""}
                    </Button>
                    <Button
                      variant="plain"
                      tone="critical"
                      onClick={() => setSelectedOrderIds(new Set())}
                    >
                      Clear selection
                    </Button>
                  </>
                )}
                {isLoading && <Spinner size="small" />}
              </InlineStack>
              {stageMover.data?.error && (
                <Box paddingBlockStart="200">
                  <Text as="p" tone="critical">
                    {stageMover.data.error}
                  </Text>
                </Box>
              )}
            </Card>
          </Layout.Section>
        )}

        {/* Empty state */}
        {!hasAnyOrders && (
          <Layout.Section>
            <Card>
              <EmptyState
                heading="No open orders in your queue"
                image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
              >
                <p>
                  When customers place orders, they'll appear here. Select an
                  order and assign it to a production stage to start tracking.
                </p>
              </EmptyState>
            </Card>
          </Layout.Section>
        )}

        {/* Unassigned orders section */}
        {(unassignedOrders as ShopifyOrder[]).length > 0 && (
          <Layout.Section>
            <Card>
              <BlockStack gap="200">
                <InlineStack align="space-between">
                  <Text as="h2" variant="headingMd">
                    Unassigned
                  </Text>
                  <Badge tone="attention">
                    {(unassignedOrders as ShopifyOrder[]).length} new
                  </Badge>
                </InlineStack>
                <Text as="p" variant="bodySm" tone="subdued">
                  Open orders not yet in a production stage.
                </Text>
              </BlockStack>
              <Divider />
              <ResourceList
                resourceName={{ singular: "order", plural: "orders" }}
                items={unassignedOrders as ShopifyOrder[]}
                renderItem={(order: ShopifyOrder) => {
                  const items = order.lineItems.edges
                    .map((e) => `${e.node.title} ×${e.node.quantity}`)
                    .join(", ");
                  return (
                    <ResourceItem
                      id={order.id}
                      name={order.name}
                      url={`https://admin.shopify.com/orders/${gidToId(order.id)}`}
                      media={
                        <Checkbox
                          label=""
                          labelHidden
                          checked={selectedOrderIds.has(order.id)}
                          onChange={() => toggleOrder(order.id)}
                        />
                      }
                      onClick={() => toggleOrder(order.id)}
                    >
                      <InlineStack align="space-between" wrap>
                        <BlockStack gap="100">
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            {order.name}
                          </Text>
                          <Text as="span" variant="bodySm">
                            {order.customer?.displayName ?? "Guest"}
                            {order.customer?.email
                              ? ` · ${order.customer.email}`
                              : ""}
                          </Text>
                          <Text as="span" variant="bodySm" tone="subdued">
                            {items}
                          </Text>
                        </BlockStack>
                        <Text as="span" variant="bodySm" tone="subdued">
                          {relativeTime(order.createdAt)}
                        </Text>
                      </InlineStack>
                    </ResourceItem>
                  );
                }}
              />
            </Card>
          </Layout.Section>
        )}

        {/* Staged orders grouped by stage */}
        {(stages as Stage[]).map((stage) => {
          const orders = ordersByStage.get(stage.id) ?? [];
          if (orders.length === 0) return null;

          return (
            <Layout.Section key={stage.id}>
              <Card>
                <BlockStack gap="200">
                  <InlineStack align="space-between">
                    <InlineStack gap="200" blockAlign="center">
                      {/* Stage color indicator */}
                      <span
                        style={{
                          display: "inline-block",
                          width: 12,
                          height: 12,
                          borderRadius: "50%",
                          backgroundColor: stage.color,
                          flexShrink: 0,
                        }}
                      />
                      <Text as="h2" variant="headingMd">
                        {stage.name}
                      </Text>
                    </InlineStack>
                    <Badge>
                      {orders.length} order{orders.length !== 1 ? "s" : ""}
                    </Badge>
                  </InlineStack>
                </BlockStack>
                <Divider />
                <ResourceList
                  resourceName={{ singular: "order", plural: "orders" }}
                  items={orders}
                  renderItem={(os: OrderStageRecord) => (
                    <ResourceItem
                      id={os.orderId}
                      name={os.orderNumber}
                      url={`https://admin.shopify.com/orders/${gidToId(os.orderId)}`}
                      media={
                        <Checkbox
                          label=""
                          labelHidden
                          checked={selectedOrderIds.has(os.orderId)}
                          onChange={() => toggleOrder(os.orderId)}
                        />
                      }
                      onClick={() => toggleOrder(os.orderId)}
                    >
                      <InlineStack align="space-between" wrap>
                        <BlockStack gap="100">
                          <Text as="span" variant="bodyMd" fontWeight="semibold">
                            {os.orderNumber}
                          </Text>
                          <Text as="span" variant="bodySm">
                            {os.customerName || "Guest"}
                            {os.customerEmail ? ` · ${os.customerEmail}` : ""}
                          </Text>
                          {os.itemSummary && (
                            <Text as="span" variant="bodySm" tone="subdued">
                              {os.itemSummary}
                            </Text>
                          )}
                        </BlockStack>
                        <BlockStack gap="100" inlineAlign="end">
                          <Text as="span" variant="bodySm" tone="subdued">
                            in stage {relativeTime(os.movedAt)}
                          </Text>
                        </BlockStack>
                      </InlineStack>
                    </ResourceItem>
                  )}
                />
              </Card>
            </Layout.Section>
          );
        })}
      </Layout>
    </Page>
  );
}
