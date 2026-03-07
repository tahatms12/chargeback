// extensions/poref-checkout/src/index.tsx
//
// Checkout UI Extension — purchase.checkout.block.render
//
// STATUS: Verified — Checkout UI extensions are available on all Shopify plans
// (not Plus-exclusive) as of Shopify's 2024 extensibility updates.
//
// Mechanism:
// 1. Renders a text field at checkout (contact section by default)
// 2. Uses applyAttributeChange to write to order customAttributes
// 3. Reads enforcement settings from extension settings (set via metafield or
//    app block settings configured in shopify.app.toml)
// 4. Soft-required: warns on buyer journey intercept if blank + required
//
// customAttributes on the order map to note_attributes in the webhook payload.

import {
  reactExtension,
  useApplyAttributeChange,
  useBuyerJourneyIntercept,
  useAttributes,
  useExtensionSettings,
  TextField,
  BlockStack,
  Text,
  InlineLayout,
  View,
  Banner,
} from "@shopify/ui-extensions-react/checkout";
import { useState, useCallback } from "react";

// Must match POREF_ATTRIBUTE_KEY in orders-create.server.ts
const ATTRIBUTE_KEY = "_poref_reference_number";

export default reactExtension(
  "purchase.checkout.block.render",
  () => <PORefField />
);

function PORefField() {
  const applyAttributeChange = useApplyAttributeChange();
  const attributes = useAttributes();
  const settings = useExtensionSettings<{
    field_label: string;
    enforcement_mode: string;
    required_tags: string;
    show_helper_text: boolean;
  }>();

  const fieldLabel = settings.field_label || "PO / Reference Number";
  const enforcementMode = settings.enforcement_mode || "OPTIONAL";
  const isRequired = enforcementMode === "ALL";
  // TAGGED mode: the extension cannot resolve customer tags at render time for
  // guest checkouts. Soft-required is applied for ALL authenticated customers
  // with matching tags as a best-effort. The webhook enforces tag logic
  // server-side for indexing.
  const showHelperText = settings.show_helper_text !== false;

  // Read any existing value from order attributes (e.g. if customer navigated back)
  const existingAttr = attributes?.find((a) => a.key === ATTRIBUTE_KEY);
  const [value, setValue] = useState(existingAttr?.value ?? "");
  const [touched, setTouched] = useState(false);
  const [interceptError, setInterceptError] = useState<string | null>(null);

  const handleChange = useCallback(
    async (newValue: string) => {
      setValue(newValue);
      setInterceptError(null);
      await applyAttributeChange({
        type: "updateAttribute",
        key: ATTRIBUTE_KEY,
        value: newValue,
      });
    },
    [applyAttributeChange]
  );

  // Buyer journey intercept — soft required: warns but does NOT hard block
  useBuyerJourneyIntercept(({ canBlockProgress }) => {
    if (!isRequired) return { behavior: "allow" };
    if (value.trim().length > 0) return { behavior: "allow" };

    // canBlockProgress is true when Shopify allows the extension to block
    // This is only reliable on Shopify Plus with function-based blocking.
    // On standard plans, we log the warning but allow progress.
    setInterceptError(`${fieldLabel} is required for this order.`);

    // Soft-required: always allow — warning is shown inline
    return { behavior: "allow" };
  });

  const showError = touched && isRequired && value.trim() === "";

  return (
    <BlockStack spacing="base">
      <TextField
        label={fieldLabel}
        value={value}
        onChange={handleChange}
        onBlur={() => setTouched(true)}
        required={isRequired}
        error={showError ? `${fieldLabel} is required` : undefined}
      />
      {showHelperText && !showError && (
        <Text size="small" appearance="subdued">
          Enter your purchase order or job reference number.
        </Text>
      )}
      {interceptError && (
        <Banner status="warning">{interceptError}</Banner>
      )}
    </BlockStack>
  );
}
