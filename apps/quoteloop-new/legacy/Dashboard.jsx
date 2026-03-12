/**
 * pages/Dashboard.jsx
 *
 * Main dashboard page.
 * Displays:
 *   - Summary stat cards (total open, follow-up due, expiry due, expired)
 *   - Full table of all open draft orders sorted oldest-first
 *   - Per-row manual actions (send follow-up, expire)
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  Page,
  Layout,
  Card,
  Text,
  Banner,
  Spinner,
  InlineStack,
  Box,
  Divider,
  Toast,
  Frame,
  BlockStack,
  Badge,
  Button,
  Tooltip,
} from "@shopify/polaris";
import { RefreshMajor } from "@shopify/polaris-icons";
import { useAuthenticatedFetch } from "../hooks/useAuthenticatedFetch";
import DraftOrderTable from "../components/DraftOrderTable";

function StatCard({ label, value, tone }) {
  return (
    <Card>
      <BlockStack gap="100">
        <Text variant="headingXl" as="p" tone={tone}>
          {value}
        </Text>
        <Text variant="bodyMd" tone="subdued">
          {label}
        </Text>
      </BlockStack>
    </Card>
  );
}

export default function Dashboard() {
  const fetchWithAuth = useAuthenticatedFetch();

  const [draftOrders, setDraftOrders] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError]             = useState(null);
  const [toast, setToast]             = useState(null);

  const loadDraftOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchWithAuth("/api/draft-orders");
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to load draft orders.");
      }
      const data = await res.json();
      setDraftOrders(data.draft_orders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchWithAuth]);

  useEffect(() => {
    loadDraftOrders();
  }, [loadDraftOrders]);

  const handleSendFollowup = async (draftOrderId) => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/draft-orders/${draftOrderId}/send-followup`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to send follow-up.");
      setToast({ message: `Follow-up email sent to ${body.sent_to}.`, error: false });
      await loadDraftOrders();
    } catch (err) {
      setToast({ message: err.message, error: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExpire = async (draftOrderId) => {
    setActionLoading(true);
    try {
      const res = await fetchWithAuth(`/api/draft-orders/${draftOrderId}/expire`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Failed to expire draft order.");
      setToast({ message: "Draft order marked as expired.", error: false });
      await loadDraftOrders();
    } catch (err) {
      setToast({ message: err.message, error: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Derived stats
  const stats = {
    total:       draftOrders.length,
    followupDue: draftOrders.filter((d) => d.status === "followup_due").length,
    expiryDue:   draftOrders.filter((d) => d.status === "expiry_due").length,
    expired:     draftOrders.filter((d) => d.status === "expired").length,
  };

  const toastMarkup = toast && (
    <Toast
      content={toast.message}
      error={toast.error}
      onDismiss={() => setToast(null)}
      duration={4000}
    />
  );

  return (
    <Frame>
      <Page
        title="Draft Orders"
        subtitle="Open draft orders sorted by age — oldest first"
        primaryAction={{
          content: "Refresh",
          icon: RefreshMajor,
          onAction: loadDraftOrders,
          loading,
        }}
      >
        {error && (
          <Box paddingBlockEnd="400">
            <Banner tone="critical" title="Error loading draft orders">
              <Text>{error}</Text>
            </Banner>
          </Box>
        )}

        {/* Summary cards */}
        <Layout>
          <Layout.Section>
            <InlineStack gap="400" wrap>
              <Box minWidth="140px">
                <StatCard label="Total open" value={stats.total} />
              </Box>
              <Box minWidth="140px">
                <StatCard label="Follow-up due" value={stats.followupDue} tone="caution" />
              </Box>
              <Box minWidth="140px">
                <StatCard label="Expiry due" value={stats.expiryDue} tone="critical" />
              </Box>
              <Box minWidth="140px">
                <StatCard label="Expired this session" value={stats.expired} tone="subdued" />
              </Box>
            </InlineStack>
          </Layout.Section>

          <Layout.Section>
            <Card>
              {loading ? (
                <Box padding="800" as="div" style={{ display: "flex", justifyContent: "center" }}>
                  <Spinner size="large" />
                </Box>
              ) : (
                <DraftOrderTable
                  draftOrders={draftOrders}
                  onSendFollowup={handleSendFollowup}
                  onExpire={handleExpire}
                  loading={actionLoading}
                />
              )}
            </Card>
          </Layout.Section>
        </Layout>
      </Page>
      {toastMarkup}
    </Frame>
  );
}
