// extensions/print-action/src/index.tsx
import { useCallback } from "react";
import {
  reactExtension,
  useApi,
  PrintAction,
} from "@shopify/ui-extensions-react/admin";

const TARGET = "admin.order-details.print-action.render";

export default reactExtension(TARGET, () => <OrderPrintAction />);

function OrderPrintAction() {
  const { data, sessionToken, extension } = useApi(TARGET);

  const orderId = (data as { selected?: Array<{ id: string }> })?.selected?.[0]?.id;

  const handlePrint = useCallback(async () => {
    if (!orderId) return;
    try {
      const token = await sessionToken.get();
      const numericId = orderId.split("/").pop();
      const appUrl = (extension as { appUrl?: string })?.appUrl ?? "";
      // Open PDF inline for browser print dialog
      const url = `${appUrl}/api/invoice/${numericId}?print=1&token=${encodeURIComponent(token)}`;
      window.open(url, "_blank");
    } catch {
      // silent — user can retry from the order action
    }
  }, [orderId, sessionToken, extension]);

  return (
    <PrintAction title="Customs Invoice (CustomsReady)" onAction={handlePrint} />
  );
}
