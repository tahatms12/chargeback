import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// extensions/order-detail-block/src/index.tsx
import { useEffect, useState, useCallback } from "react";
import { reactExtension, useApi, AdminBlock, BlockStack, InlineStack, Text, Badge, Button, Divider, Banner, SkeletonDisplayText, SkeletonBodyText, } from "@shopify/ui-extensions-react/admin";
const TARGET = "admin.order-details.block.render";
export default reactExtension(TARGET, () => _jsx(OrderDetailBlock, {}));
// ─── Component ────────────────────────────────────────────────────────────────
function OrderDetailBlock() {
    const { data, sessionToken, extension } = useApi(TARGET);
    const orderId = data?.selected?.[0]?.id;
    const [readiness, setReadiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const fetchReadiness = useCallback(async () => {
        if (!orderId)
            return;
        setLoading(true);
        setError(null);
        try {
            const token = await sessionToken.get();
            const numericId = orderId.split("/").pop();
            const appUrl = extension?.appUrl ?? "";
            const resp = await fetch(`${appUrl}/api/invoice/${numericId}`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            if (!resp.ok) {
                throw new Error(`HTTP ${resp.status}`);
            }
            const result = (await resp.json());
            setReadiness(result);
        }
        catch (err) {
            setError("Unable to load customs data. Please try again.");
        }
        finally {
            setLoading(false);
        }
    }, [orderId, sessionToken, extension]);
    useEffect(() => {
        fetchReadiness();
    }, [fetchReadiness]);
    const handleGenerateInvoice = useCallback(async () => {
        if (!orderId)
            return;
        try {
            const token = await sessionToken.get();
            const numericId = orderId.split("/").pop();
            const appUrl = extension?.appUrl ?? "";
            // Trigger download by opening the PDF endpoint
            const url = `${appUrl}/api/invoice/${numericId}?token=${encodeURIComponent(token)}`;
            window.open(url, "_blank");
        }
        catch (err) {
            // no-op — user can retry
        }
    }, [orderId, sessionToken, extension]);
    return (_jsxs(AdminBlock, { title: "Customs Readiness", children: [loading && (_jsxs(BlockStack, { gap: "200", children: [_jsx(SkeletonDisplayText, { size: "small" }), _jsx(SkeletonBodyText, { lines: 3 })] })), error && !loading && (_jsxs(BlockStack, { gap: "300", children: [_jsx(Banner, { tone: "critical", children: error }), _jsx(Button, { onPress: fetchReadiness, variant: "secondary", children: "Retry" })] })), readiness && !loading && (_jsxs(BlockStack, { gap: "400", children: [_jsxs(InlineStack, { gap: "300", blockAlignment: "center", children: [_jsx(Text, { fontWeight: "semibold", as: "span", children: "Overall Status" }), _jsx(ReadinessBadge, { readiness: readiness.readiness })] }), readiness.readiness !== "complete" && (_jsx(Banner, { tone: "warning", children: readiness.readiness === "not_ready"
                            ? "This order has no customs data. The invoice will contain placeholder values."
                            : "Some line items are missing HS codes or country-of-origin data." })), _jsx(Divider, {}), _jsxs(BlockStack, { gap: "200", children: [_jsx(Text, { fontWeight: "semibold", as: "span", tone: "subdued", children: "Line Items" }), readiness.lines.map((line) => (_jsx(LineReadinessRow, { line: line }, line.lineItemId)))] }), _jsx(Divider, {}), _jsx(Button, { variant: "primary", onPress: handleGenerateInvoice, children: "Generate Customs Invoice" })] }))] }));
}
// ─── Line readiness row ───────────────────────────────────────────────────────
function LineReadinessRow({ line }) {
    const isOk = line.status === "complete";
    return (_jsxs(BlockStack, { gap: "100", children: [_jsxs(InlineStack, { gap: "200", blockAlignment: "center", inlineAlignment: "space-between", children: [_jsxs(Text, { as: "span", truncate: true, children: [line.title, line.isCustomItem && (_jsxs(Text, { as: "span", tone: "subdued", children: [" ", "(Custom item)"] }))] }), isOk ? (_jsx(Badge, { tone: "success", children: "Ready" })) : (_jsx(Badge, { tone: "critical", children: "Incomplete" }))] }), !isOk && (_jsxs(InlineStack, { gap: "200", children: [(line.status === "missing_hs" || line.status === "missing_both") && (_jsx(Text, { as: "span", tone: "critical", size: "small", children: "HS code missing" })), (line.status === "missing_coo" || line.status === "missing_both") && (_jsx(Text, { as: "span", tone: "critical", size: "small", children: "Country of origin missing" }))] }))] }));
}
// ─── Badge helper ─────────────────────────────────────────────────────────────
function ReadinessBadge({ readiness }) {
    if (readiness === "complete")
        return _jsx(Badge, { tone: "success", children: "Complete" });
    if (readiness === "partial")
        return _jsx(Badge, { tone: "warning", children: "Partial" });
    return _jsx(Badge, { tone: "critical", children: "Not Ready" });
}
