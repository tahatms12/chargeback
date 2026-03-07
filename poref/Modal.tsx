// extensions/poref-pos/src/Modal.tsx
//
// POS UI Extension — pos.home.modal.render
// Staff enters the buyer's PO/reference number during an active POS sale.
//
// Data flow:
// 1. Staff opens tile → this modal renders
// 2. Staff types reference number
// 3. On save: sets the value as a cart note attribute via useCartAttributeSet
//    — POS maps cart attributes to order note_attributes on order creation
// 4. The orders/create webhook then reads note_attributes and writes metafield
//
// STATUS: Verified — useCartAttributeSet is the supported mechanism in POS
// extensions for attaching custom data to the active cart/order.

import {
  reactExtension,
  useApi,
  Screen,
  ScrollView,
  Stack,
  TextField,
  Button,
  Banner,
  Text,
  useCartAttributeSet,
  useCart,
  useExtensionPoint,
} from "@shopify/ui-extensions-react/point-of-sale";
import { useState, useCallback } from "react";

// Must match POREF_ATTRIBUTE_KEY in orders-create.server.ts
const ATTRIBUTE_KEY = "_poref_reference_number";

const TARGET = "pos.home.modal.render";

export default reactExtension(TARGET, () => <PORefModal />);

function PORefModal() {
  const api = useApi<typeof TARGET>();
  const setCartAttribute = useCartAttributeSet();
  const cart = useCart();

  // Read existing value if any
  const existingAttr = cart?.attributes?.find(
    (a: any) => a.key === ATTRIBUTE_KEY
  );
  const [value, setValue] = useState<string>(existingAttr?.value ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = useCallback(async () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Enter a PO or reference number.");
      return;
    }
    if (trimmed.length > 255) {
      setError("Maximum 255 characters.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await setCartAttribute({ key: ATTRIBUTE_KEY, value: trimmed });
      setSaved(true);
      // Close modal after short confirmation delay
      setTimeout(() => api.action.close(), 1000);
    } catch (e: any) {
      setError("Failed to save. Please try again.");
      setSaving(false);
    }
  }, [value, setCartAttribute, api]);

  const handleClear = useCallback(async () => {
    await setCartAttribute({ key: ATTRIBUTE_KEY, value: "" });
    setValue("");
    setSaved(false);
    setError(null);
  }, [setCartAttribute]);

  return (
    <Screen title="PO / Reference Number" isLoading={false}>
      <ScrollView>
        <Stack direction="vertical" spacing="base" padding="base">
          {saved ? (
            <Banner
              variant="confirmation"
              title={`Reference "${value.trim()}" saved to this order.`}
            />
          ) : (
            <>
              {error && <Banner variant="error" title={error} />}

              <Text variant="body">
                Enter the buyer's PO number, job reference, or order reference
                for this sale.
              </Text>

              <TextField
                label="PO / Reference Number"
                value={value}
                onChange={setValue}
                placeholder="e.g. PO-2024-1042"
                maxLength={255}
              />

              <Stack direction="horizontal" spacing="base">
                <Button
                  title="Save"
                  type="primary"
                  onPress={handleSave}
                  isLoading={saving}
                  isDisabled={!value.trim()}
                />
                <Button
                  title="Cancel"
                  type="basic"
                  onPress={() => api.action.close()}
                  isDisabled={saving}
                />
              </Stack>

              {existingAttr?.value && (
                <Button
                  title="Clear reference"
                  type="destructive"
                  onPress={handleClear}
                />
              )}
            </>
          )}
        </Stack>
      </ScrollView>
    </Screen>
  );
}
