import { json } from "@remix-run/node";
import { useLoaderData, useSubmit, useNavigation, Form } from "@remix-run/react";
import {
  Page,
  Layout,
  Card,
  BlockStack,
  InlineStack,
  Text,
  TextField,
  Checkbox,
  Button,
  ButtonGroup,
  Banner,
  Divider,
  Badge,
  Icon,
  Box,
  EmptyState,
} from "@shopify/polaris";
import { DeleteIcon, ArrowUpIcon, ArrowDownIcon } from "@shopify/polaris-icons";
import { useState, useCallback } from "react";
import { authenticate } from "~/shopify.server";
import {
  getStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
} from "~/lib/stages.server";

export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const stages = await getStages(session.shop);
  return json({ stages });
};

export const action = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "create") {
    const name = formData.get("name")?.toString().trim();
    if (!name) return json({ error: "Stage name is required" }, { status: 400 });

    await createStage(shop, {
      name,
      emailEnabled: formData.get("emailEnabled") === "true",
      emailSubject: formData.get("emailSubject")?.toString() ?? "",
      emailBody: formData.get("emailBody")?.toString() ?? "",
    });
    return json({ ok: true });
  }

  if (intent === "update") {
    const id = formData.get("id")?.toString();
    if (!id) return json({ error: "Stage id is required" }, { status: 400 });

    await updateStage(shop, id, {
      name: formData.get("name")?.toString().trim(),
      emailEnabled: formData.get("emailEnabled") === "true",
      emailSubject: formData.get("emailSubject")?.toString(),
      emailBody: formData.get("emailBody")?.toString(),
    });
    return json({ ok: true });
  }

  if (intent === "delete") {
    const id = formData.get("id")?.toString();
    if (!id) return json({ error: "Stage id is required" }, { status: 400 });
    await deleteStage(shop, id);
    return json({ ok: true });
  }

  if (intent === "reorder") {
    const ids = formData.getAll("ids").map(String);
    await reorderStages(shop, ids);
    return json({ ok: true });
  }

  return json({ error: "Unknown intent" }, { status: 400 });
};

export default function StagesPage() {
  const { stages } = useLoaderData();
  const submit = useSubmit();
  const navigation = useNavigation();
  const isBusy = navigation.state !== "idle";

  const [localStages, setLocalStages] = useState(stages);
  const [expandedId, setExpandedId] = useState(null);
  const [newStage, setNewStage] = useState({
    name: "",
    emailEnabled: true,
    emailSubject: "",
    emailBody: "",
  });
  const [editDrafts, setEditDrafts] = useState({});

  const handleCreateSubmit = useCallback(() => {
    if (!newStage.name.trim()) return;
    const fd = new FormData();
    fd.set("intent", "create");
    fd.set("name", newStage.name);
    fd.set("emailEnabled", String(newStage.emailEnabled));
    fd.set("emailSubject", newStage.emailSubject);
    fd.set("emailBody", newStage.emailBody);
    submit(fd, { method: "post" });
    setNewStage({ name: "", emailEnabled: true, emailSubject: "", emailBody: "" });
  }, [newStage, submit]);

  const handleUpdateSubmit = useCallback(
    (id) => {
      const draft = editDrafts[id];
      if (!draft) return;
      const fd = new FormData();
      fd.set("intent", "update");
      fd.set("id", id);
      fd.set("name", draft.name);
      fd.set("emailEnabled", String(draft.emailEnabled));
      fd.set("emailSubject", draft.emailSubject);
      fd.set("emailBody", draft.emailBody);
      submit(fd, { method: "post" });
      setExpandedId(null);
    },
    [editDrafts, submit]
  );

  const handleDelete = useCallback(
    (id) => {
      if (!confirm("Delete this stage? Orders in this stage will be moved to Unassigned.")) return;
      const fd = new FormData();
      fd.set("intent", "delete");
      fd.set("id", id);
      submit(fd, { method: "post" });
    },
    [submit]
  );

  const handleMoveUp = useCallback(
    (index) => {
      if (index === 0) return;
      const reordered = [...localStages];
      [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
      setLocalStages(reordered);
      const fd = new FormData();
      fd.set("intent", "reorder");
      reordered.forEach((s) => fd.append("ids", s.id));
      submit(fd, { method: "post" });
    },
    [localStages, submit]
  );

  const handleMoveDown = useCallback(
    (index) => {
      if (index === localStages.length - 1) return;
      const reordered = [...localStages];
      [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
      setLocalStages(reordered);
      const fd = new FormData();
      fd.set("intent", "reorder");
      reordered.forEach((s) => fd.append("ids", s.id));
      submit(fd, { method: "post" });
    },
    [localStages, submit]
  );

  const toggleExpand = useCallback(
    (stage) => {
      if (expandedId === stage.id) {
        setExpandedId(null);
      } else {
        setExpandedId(stage.id);
        setEditDrafts((prev) => ({
          ...prev,
          [stage.id]: {
            name: stage.name,
            emailEnabled: stage.emailEnabled,
            emailSubject: stage.emailSubject,
            emailBody: stage.emailBody,
          },
        }));
      }
    },
    [expandedId]
  );

  const updateDraft = useCallback((id, field, value) => {
    setEditDrafts((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  }, []);

  return (
    <Page
      title="Production Stages"
      subtitle="Define the stages each order moves through, and configure automatic customer emails."
      backAction={{ content: "Queue", url: "/app" }}
    >
      <BlockStack gap="400">
        <Banner tone="info" title="Template variables for email content">
          <p>
            Use <code>{"{{order_name}}"}</code>, <code>{"{{customer_name}}"}</code>,{" "}
            <code>{"{{stage_name}}"}</code>, and <code>{"{{shop_name}}"}</code> in subject
            and body text.
          </p>
        </Banner>

        <Card>
          <BlockStack gap="200">
            <Text variant="headingMd">Current stages</Text>
            <Text variant="bodySm" tone="subdued">
              Use the arrows to reorder. Click a stage name to edit its email settings.
            </Text>
            <Divider />

            {localStages.length === 0 && (
              <Text tone="subdued">No stages yet. Add one below.</Text>
            )}

            {localStages.map((stage, index) => {
              const draft = editDrafts[stage.id] ?? stage;
              const isExpanded = expandedId === stage.id;

              return (
                <Box key={stage.id} borderColor="border" borderWidth="025" borderRadius="200" padding="300">
                  <BlockStack gap="200">
                    <InlineStack align="space-between" blockAlign="center">
                      <InlineStack gap="200" blockAlign="center">
                        <ButtonGroup>
                          <Button
                            size="micro"
                            icon={ArrowUpIcon}
                            onClick={() => handleMoveUp(index)}
                            disabled={index === 0 || isBusy}
                            accessibilityLabel="Move stage up"
                          />
                          <Button
                            size="micro"
                            icon={ArrowDownIcon}
                            onClick={() => handleMoveDown(index)}
                            disabled={index === localStages.length - 1 || isBusy}
                            accessibilityLabel="Move stage down"
                          />
                        </ButtonGroup>
                        <Button
                          variant="plain"
                          onClick={() => toggleExpand(stage)}
                        >
                          <Text variant="bodyMd" fontWeight="semibold">
                            {stage.name}
                          </Text>
                        </Button>
                        {stage.emailEnabled ? (
                          <Badge tone="success">Email on</Badge>
                        ) : (
                          <Badge tone="subdued">Email off</Badge>
                        )}
                      </InlineStack>

                      <Button
                        icon={DeleteIcon}
                        tone="critical"
                        variant="plain"
                        onClick={() => handleDelete(stage.id)}
                        disabled={isBusy}
                        accessibilityLabel={`Delete ${stage.name}`}
                      />
                    </InlineStack>

                    {isExpanded && (
                      <>
                        <Divider />
                        <BlockStack gap="300">
                          <TextField
                            label="Stage name"
                            value={draft.name}
                            onChange={(v) => updateDraft(stage.id, "name", v)}
                            autoComplete="off"
                          />
                          <Checkbox
                            label="Send customer email when order enters this stage"
                            checked={draft.emailEnabled}
                            onChange={(v) => updateDraft(stage.id, "emailEnabled", v)}
                          />
                          {draft.emailEnabled && (
                            <>
                              <TextField
                                label="Email subject"
                                value={draft.emailSubject}
                                onChange={(v) => updateDraft(stage.id, "emailSubject", v)}
                                autoComplete="off"
                              />
                              <TextField
                                label="Email body"
                                value={draft.emailBody}
                                onChange={(v) => updateDraft(stage.id, "emailBody", v)}
                                multiline={6}
                                autoComplete="off"
                                helpText="Plain text. Use template variables listed in the banner above."
                              />
                            </>
                          )}
                          <InlineStack gap="200">
                            <Button
                              variant="primary"
                              size="slim"
                              onClick={() => handleUpdateSubmit(stage.id)}
                              loading={isBusy}
                            >
                              Save
                            </Button>
                            <Button
                              size="slim"
                              onClick={() => setExpandedId(null)}
                            >
                              Cancel
                            </Button>
                          </InlineStack>
                        </BlockStack>
                      </>
                    )}
                  </BlockStack>
                </Box>
              );
            })}
          </BlockStack>
        </Card>

        {/* Add new stage */}
        <Card>
          <BlockStack gap="300">
            <Text variant="headingMd">Add a new stage</Text>
            <TextField
              label="Stage name"
              value={newStage.name}
              onChange={(v) => setNewStage((p) => ({ ...p, name: v }))}
              autoComplete="off"
              placeholder="e.g. Glazing, Finishing, Packaging"
            />
            <Checkbox
              label="Send customer email when order enters this stage"
              checked={newStage.emailEnabled}
              onChange={(v) => setNewStage((p) => ({ ...p, emailEnabled: v }))}
            />
            {newStage.emailEnabled && (
              <>
                <TextField
                  label="Email subject"
                  value={newStage.emailSubject}
                  onChange={(v) => setNewStage((p) => ({ ...p, emailSubject: v }))}
                  autoComplete="off"
                  placeholder="Your order {{order_name}} is now: {{stage_name}}"
                />
                <TextField
                  label="Email body"
                  value={newStage.emailBody}
                  onChange={(v) => setNewStage((p) => ({ ...p, emailBody: v }))}
                  multiline={5}
                  autoComplete="off"
                />
              </>
            )}
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              disabled={!newStage.name.trim() || isBusy}
              loading={isBusy}
            >
              Add Stage
            </Button>
          </BlockStack>
        </Card>
      </BlockStack>
    </Page>
  );
}
