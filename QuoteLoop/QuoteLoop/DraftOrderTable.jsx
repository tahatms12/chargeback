/**
 * DraftOrderTable.jsx
 *
 * Renders the list of open draft orders with age, status badge, and action buttons.
 * Status values (from backend):
 *   open          - Within follow-up threshold (recently created)
 *   followup_due  - Past follow-up threshold, no email sent yet
 *   follow_up_sent - Follow-up email already sent
 *   expiry_due    - Past expiry threshold, not yet tagged expired
 *   expired       - Tagged expired in Shopify
 */

import React from "react";
import {
  DataTable,
  Badge,
  Button,
  ButtonGroup,
  Text,
  Tooltip,
  InlineStack,
  Link,
} from "@shopify/polaris";
import { EmailMajor, ArchiveMajor } from "@shopify/polaris-icons";

const STATUS_BADGE = {
  open:             { tone: undefined,   label: "Open" },
  followup_due:     { tone: "warning",   label: "Follow-up due" },
  follow_up_sent:   { tone: "info",      label: "Follow-up sent" },
  expiry_due:       { tone: "critical",  label: "Expiry due" },
  expired:          { tone: "subdued",   label: "Expired" },
};

export default function DraftOrderTable({ draftOrders, onSendFollowup, onExpire, loading }) {
  if (!draftOrders || draftOrders.length === 0) {
    return (
      <Text as="p" variant="bodyMd" tone="subdued">
        No open draft orders found.
      </Text>
    );
  }

  const rows = draftOrders.map((draft) => {
    const badge = STATUS_BADGE[draft.status] || STATUS_BADGE.open;

    const nameCell = draft.invoice_url ? (
      <Link url={draft.invoice_url} external monochrome>
        {draft.name}
      </Link>
    ) : (
      <Text>{draft.name}</Text>
    );

    const statusCell = (
      <Badge tone={badge.tone}>{badge.label}</Badge>
    );

    const ageCell = (
      <Text>
        {draft.age_in_days === 0 ? "Today" : `${draft.age_in_days}d`}
      </Text>
    );

    const amountCell = (
      <Text fontWeight="semibold">
        {draft.currency} {Number(draft.total_price).toFixed(2)}
      </Text>
    );

    const customerCell = (
      <Text>
        {draft.customer_name || draft.customer_email || (
          <Text tone="subdued">Unknown</Text>
        )}
      </Text>
    );

    const canFollowUp = !draft.actions.includes("follow_up_sent") && !draft.actions.includes("expired");
    const canExpire   = !draft.actions.includes("expired");

    const actionsCell = (
      <InlineStack gap="200">
        <Tooltip content={canFollowUp ? "Send follow-up email" : "Follow-up already sent"}>
          <Button
            icon={EmailMajor}
            size="slim"
            disabled={!canFollowUp || loading}
            onClick={() => onSendFollowup(draft.id)}
            accessibilityLabel={`Send follow-up for ${draft.name}`}
          />
        </Tooltip>
        <Tooltip content={canExpire ? "Mark as expired" : "Already expired"}>
          <Button
            icon={ArchiveMajor}
            size="slim"
            tone="critical"
            disabled={!canExpire || loading}
            onClick={() => onExpire(draft.id)}
            accessibilityLabel={`Expire ${draft.name}`}
          />
        </Tooltip>
      </InlineStack>
    );

    return [nameCell, customerCell, amountCell, ageCell, statusCell, actionsCell];
  });

  return (
    <DataTable
      columnContentTypes={["text", "text", "numeric", "numeric", "text", "text"]}
      headings={["Draft #", "Customer", "Amount", "Age", "Status", "Actions"]}
      rows={rows}
      hoverable
    />
  );
}
