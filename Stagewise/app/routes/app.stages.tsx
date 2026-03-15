// app/routes/app.stages.tsx
// Stage configuration page.
// Source requirement: define 3–7 custom production stages per store.
// Allows: create, rename, set color, configure email template, toggle email,
// reorder (up/down buttons), delete.

import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Badge,
  Banner,
  BlockStack,
  Box,
  Button,
  Card,
  Checkbox,
  Divider,
  FormLayout,
  InlineStack,
  Layout,
  Modal,
  Page,
  ResourceItem,
  ResourceList,
  Select,
  Text,
  TextField,
} from "@shopify/polaris";
import { useCallback, useEffect, useState } from "react";
import { authenticate } from "../shopify.server";
import { db } from "../db.server";

const MAX_STAGES = 7;
const MIN_STAGES = 1;

const STAGE_COLORS = [
  { label: "Indigo", value: "#5C6AC4" },
  { label: "Yellow", value: "#EEC200" },
  { label: "Orange", value: "#F49342" },
  { label: "Purple", value: "#9C6ADE" },
  { label: "Teal", value: "#47C1BF" },
  { label: "Green", value: "#50B83C" },
  { label: "Red", value: "#DE3618" },
  { label: "Blue", value: "#006FBB" },
  { label: "Gray", value: "#637381" },
];

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const stages = await db.productionStage.findMany({
    where: { shopDomain: session.shop },
    orderBy: { position: "asc" },
  });
  return json({ stages });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const shopDomain = session.shop;
  const form = await request.formData();
  const intent = form.get("intent") as string;

  switch (intent) {
    case "create": {
      const name = (form.get("name") as string | null)?.trim();
      if (!name) return json({ error: "Stage name is required." }, { status: 400 });

      const count = await db.productionStage.count({ where: { shopDomain } });
      if (count >= MAX_STAGES) {
        return json({ error: `Maximum ${MAX_STAGES} stages allowed.` }, { status: 400 });
      }

      await db.productionStage.create({
        data: {
          shopDomain,
          name,
          position: count + 1,
          color: (form.get("color") as string) || "#637381",
          sendEmail: form.get("sendEmail") === "true",
          emailSubject: (form.get("emailSubject") as string) || "",
          emailBody: (form.get("emailBody") as string) || "",
        },
      });
      return json({ ok: true });
    }

    case "update": {
      const stageId = form.get("stageId") as string;
      const name = (form.get("name") as string | null)?.trim();
      if (!name) return json({ error: "Stage name is required." }, { status: 400 });

      await db.productionStage.updateMany({
        where: { id: stageId, shopDomain },
        data: {
          name,
          color: (form.get("color") as string) || "#637381",
          sendEmail: form.get("sendEmail") === "true",
          emailSubject: (form.get("emailSubject") as string) || "",
          emailBody: (form.get("emailBody") as string) || "",
        },
      });
      return json({ ok: true });
    }

    case "delete": {
      const stageId = form.get("stageId") as string;

      const count = await db.productionStage.count({ where: { shopDomain } });
      if (count <= MIN_STAGES) {
        return json({ error: "At least one stage must remain." }, { status: 400 });
      }

      const stage = await db.productionStage.findFirst({
        where: { id: stageId, shopDomain },
      });
      if (!stage) return json({ error: "Stage not found." }, { status: 404 });

      await db.productionStage.delete({ where: { id: stageId } });

      // Renumber remaining stages
      const remaining = await db.productionStage.findMany({
        where: { shopDomain },
        orderBy: { position: "asc" },
      });
      for (let i = 0; i < remaining.length; i++) {
        await db.productionStage.update({
          where: { id: remaining[i].id },
          data: { position: i + 1 },
        });
      }
      return json({ ok: true });
    }

    case "moveUp":
    case "moveDown": {
      const stageId = form.get("stageId") as string;
      const stage = await db.productionStage.findFirst({
        where: { id: stageId, shopDomain },
      });
      if (!stage) return json({ error: "Stage not found." }, { status: 404 });

      const swapPosition =
        intent === "moveUp" ? stage.position - 1 : stage.position + 1;
      const sibling = await db.productionStage.findFirst({
        where: { shopDomain, position: swapPosition },
      });
      if (!sibling) return json({ ok: true }); // already at boundary

      // Swap positions
      await db.$transaction([
        db.productionStage.update({
          where: { id: stage.id },
          data: { position: swapPosition },
        }),
        db.productionStage.update({
          where: { id: sibling.id },
          data: { position: stage.position },
        }),
      ]);
      return json({ ok: true });
    }

    default:
      return json({ error: "Unknown intent." }, { status: 400 });
  }
};

type Stage = {
  id: string;
  name: string;
  position: number;
  color: string;
  emailSubject: string;
  emailBody: string;
  sendEmail: boolean;
};

type StageFormState = {
  name: string;
  color: string;
  sendEmail: boolean;
  emailSubject: string;
  emailBody: string;
};

const DEFAULT_FORM: StageFormState = {
  name: "",
  color: "#637381",
  sendEmail: true,
  emailSubject: "Update on your order {{orderNumber}}",
  emailBody: `<p>Hi {{customerName}},</p>\n<p>Your order <strong>{{orderNumber}}</strong> has moved to the <em>{{stageName}}</em> stage.</p>\n<p>Thank you,<br>{{shopName}}</p>`,
};

export default function StagesPage() {
  const { stages } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<{ ok?: boolean; error?: string }>();
  const reorderFetcher = useFetcher();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);
  const [form, setForm] = useState<StageFormState>(DEFAULT_FORM);

  const isSubmitting = fetcher.state === "submitting";

  // Close modal and reset form on successful create/update
  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      setModalOpen(false);
      setEditingStage(null);
      setForm(DEFAULT_FORM);
    }
  }, [fetcher.state, fetcher.data]);

  const openCreate = useCallback(() => {
    setEditingStage(null);
    setForm(DEFAULT_FORM);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((stage: Stage) => {
    setEditingStage(stage);
    setForm({
      name: stage.name,
      color: stage.color,
      sendEmail: stage.sendEmail,
      emailSubject: stage.emailSubject,
      emailBody: stage.emailBody,
    });
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(() => {
    const data: Record<string, string> = {
      intent: editingStage ? "update" : "create",
      name: form.name,
      color: form.color,
      sendEmail: String(form.sendEmail),
      emailSubject: form.emailSubject,
      emailBody: form.emailBody,
    };
    if (editingStage) data.stageId = editingStage.id;
    fetcher.submit(data, { method: "POST" });
  }, [fetcher, form, editingStage]);

  const handleDelete = useCallback(
    (stageId: string) => {
      if (!confirm("Delete this stage? Orders in this stage will be unassigned."))
        return;
      fetcher.submit({ intent: "delete", stageId }, { method: "POST" });
    },
    [fetcher]
  );

  const handleReorder = useCallback(
    (stageId: string, direction: "moveUp" | "moveDown") => {
      reorderFetcher.submit(
        { intent: direction, stageId },
        { method: "POST" }
      );
    },
    [reorderFetcher]
  );

  const sortedStages = [...(stages as Stage[])].sort(
    (a, b) => a.position - b.position
  );

  return (
    <Page
      title="Production Stages"
      subtitle="Define the named stages your orders move through."
      primaryAction={
        stages.length < MAX_STAGES
          ? { content: "Add stage", onAction: openCreate }
          : undefined
      }
    >
      <Layout>
        {stages.length >= MAX_STAGES && (
          <Layout.Section>
            <Banner tone="info">
              Maximum of {MAX_STAGES} stages reached. Delete a stage to add a
              new one.
            </Banner>
          </Layout.Section>
        )}

        {fetcher.data?.error && (
          <Layout.Section>
            <Banner tone="critical">{fetcher.data.error}</Banner>
          </Layout.Section>
        )}

        <Layout.Section>
          <Card>
            <BlockStack gap="200">
              <Text as="p" variant="bodySm" tone="subdued">
                Template variables available in subject and body:{" "}
                <code>{"{{orderNumber}}"}</code>,{" "}
                <code>{"{{customerName}}"}</code>,{" "}
                <code>{"{{stageName}}"}</code>, <code>{"{{shopName}}"}</code>
              </Text>
            </BlockStack>
            <Divider />
            <ResourceList
              resourceName={{ singular: "stage", plural: "stages" }}
              items={sortedStages}
              renderItem={(stage: Stage) => (
                <ResourceItem
                  id={stage.id}
                  name={stage.name}
                  onClick={() => openEdit(stage)}
                >
                  <InlineStack align="space-between" wrap blockAlign="center">
                    <InlineStack gap="300" blockAlign="center">
                      <span
                        style={{
                          display: "inline-block",
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          backgroundColor: stage.color,
                          border: "1px solid rgba(0,0,0,0.12)",
                          flexShrink: 0,
                        }}
                      />
                      <BlockStack gap="050">
                        <Text as="span" variant="bodyMd" fontWeight="semibold">
                          {stage.position}. {stage.name}
                        </Text>
                        <InlineStack gap="100">
                          <Badge tone={stage.sendEmail ? "success" : "enabled"}>
                            {stage.sendEmail ? "Email on" : "Email off"}
                          </Badge>
                        </InlineStack>
                      </BlockStack>
                    </InlineStack>
                    <InlineStack gap="200">
                      <Button
                        size="slim"
                        disabled={stage.position === 1}
                        onClick={(e) => {
                          e?.stopPropagation();
                          handleReorder(stage.id, "moveUp");
                        }}
                      >
                        ↑
                      </Button>
                      <Button
                        size="slim"
                        disabled={stage.position === sortedStages.length}
                        onClick={(e) => {
                          e?.stopPropagation();
                          handleReorder(stage.id, "moveDown");
                        }}
                      >
                        ↓
                      </Button>
                      <Button
                        size="slim"
                        onClick={(e) => {
                          e?.stopPropagation();
                          openEdit(stage);
                        }}
                      >
                        Edit
                      </Button>
                      <Button
                        size="slim"
                        tone="critical"
                        disabled={sortedStages.length <= MIN_STAGES}
                        onClick={(e) => {
                          e?.stopPropagation();
                          handleDelete(stage.id);
                        }}
                      >
                        Delete
                      </Button>
                    </InlineStack>
                  </InlineStack>
                </ResourceItem>
              )}
            />
          </Card>
        </Layout.Section>
      </Layout>

      {/* Create / Edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingStage ? `Edit stage: ${editingStage.name}` : "Add stage"}
        primaryAction={{
          content: "Save",
          onAction: handleSave,
          loading: isSubmitting,
        }}
        secondaryActions={[
          { content: "Cancel", onAction: () => setModalOpen(false) },
        ]}
      >
        <Modal.Section>
          <FormLayout>
            <TextField
              label="Stage name"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              autoComplete="off"
              placeholder="e.g. In Production"
              maxLength={40}
            />
            <Select
              label="Color"
              options={STAGE_COLORS}
              value={form.color}
              onChange={(v) => setForm((f) => ({ ...f, color: v }))}
              helpText={
                <InlineStack gap="100" blockAlign="center">
                  <span
                    style={{
                      display: "inline-block",
                      width: 12,
                      height: 12,
                      borderRadius: "50%",
                      backgroundColor: form.color,
                      border: "1px solid rgba(0,0,0,0.2)",
                    }}
                  />
                  <span>Stage indicator color in queue view</span>
                </InlineStack>
              }
            />
            <Checkbox
              label="Send customer email when order enters this stage"
              checked={form.sendEmail}
              onChange={(v) => setForm((f) => ({ ...f, sendEmail: v }))}
            />
            {form.sendEmail && (
              <>
                <TextField
                  label="Email subject"
                  value={form.emailSubject}
                  onChange={(v) => setForm((f) => ({ ...f, emailSubject: v }))}
                  autoComplete="off"
                  placeholder="Update on your order {{orderNumber}}"
                />
                <TextField
                  label="Email body (HTML)"
                  value={form.emailBody}
                  onChange={(v) => setForm((f) => ({ ...f, emailBody: v }))}
                  multiline={6}
                  autoComplete="off"
                  helpText="Use {{orderNumber}}, {{customerName}}, {{stageName}}, {{shopName}}"
                />
              </>
            )}
          </FormLayout>
        </Modal.Section>
      </Modal>
    </Page>
  );
}
