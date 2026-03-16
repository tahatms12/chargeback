import { useFetcher } from "@remix-run/react";
import {
  BlockStack,
  InlineStack,
  Text,
  Badge,
  Select,
  Button,
  Box,
  Divider,
} from "@shopify/polaris";
import { useState, useCallback } from "react";

/**
 * Renders a single order in the production queue.
 * Provides an inline stage selector and Move button.
 *
 * Props:
 *   order  — OrderStage record from DB
 *   stages — full list of Stage records for this shop
 */
export function OrderCard({ order, stages }) {
  const fetcher = useFetcher();
  const isMoving = fetcher.state !== "idle";

  const [selectedStageId, setSelectedStageId] = useState(
    order.stageId ?? "__unassigned__"
  );

  const stageOptions = [
    { label: "— Unassigned —", value: "__unassigned__" },
    ...stages.map((s) => ({ label: s.name, value: s.id })),
  ];

  const hasChanged = selectedStageId !== (order.stageId ?? "__unassigned__");

  const handleMove = useCallback(() => {
    const newStageId =
      selectedStageId === "__unassigned__" ? "" : selectedStageId;
    fetcher.submit(
      {
        orderId: order.orderId,
        newStageId,
      },
      { method: "POST", action: "/api/move-order" }
    );
  }, [fetcher, order.orderId, selectedStageId]);

  // Optimistic display: show the new stage name while moving
  const displayStage =
    isMoving && hasChanged
      ? stages.find((s) => s.id === selectedStageId)?.name ?? "Unassigned"
      : order.stageName ?? "Unassigned";

  return (
    <Box
      background="bg-surface-secondary"
      borderRadius="200"
      padding="300"
      borderColor="border"
      borderWidth="025"
    >
      <BlockStack gap="200">
        <InlineStack align="space-between" blockAlign="start">
          <BlockStack gap="050">
            <Text variant="bodyMd" fontWeight="semibold">
              {order.orderName}
            </Text>
            {order.customerName && (
              <Text variant="bodySm" tone="subdued">
                {order.customerName}
                {order.customerEmail ? ` · ${order.customerEmail}` : ""}
              </Text>
            )}
            {order.productSummary && (
              <Text variant="bodySm" tone="subdued">
                {order.productSummary}
              </Text>
            )}
          </BlockStack>

          {isMoving ? (
            <Badge tone="attention">Moving…</Badge>
          ) : (
            <Badge>{displayStage}</Badge>
          )}
        </InlineStack>

        <Divider />

        <InlineStack gap="200" blockAlign="end">
          <Box minWidth="200px">
            <Select
              label="Move to stage"
              labelHidden
              options={stageOptions}
              value={selectedStageId}
              onChange={setSelectedStageId}
              disabled={isMoving}
            />
          </Box>
          <Button
            size="slim"
            onClick={handleMove}
            disabled={!hasChanged || isMoving}
            loading={isMoving}
          >
            Move
          </Button>
        </InlineStack>
      </BlockStack>
    </Box>
  );
}
