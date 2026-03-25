import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import Papa from "papaparse";
import { authenticate } from "~/shopify.server";
import { normalizeHeader } from "~/lib/shopify-csv-spec";

// ------------------------------------------------------------------
// GraphQL mutation for creating a single product
// ------------------------------------------------------------------
const PRODUCT_CREATE_MUTATION = `#graphql
  mutation productCreate($input: ProductInput!) {
    productCreate(input: $input) {
      product {
        id
        title
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

type ProductRow = Record<string, string>;

// ------------------------------------------------------------------
// Map a normalized CSV row → Shopify ProductInput
// ------------------------------------------------------------------
function rowToProductInput(row: ProductRow) {
  const title = row["Title"] ?? "";
  const handle = row["Handle"] ?? "";
  const bodyHtml = row["Body (HTML)"] ?? "";
  const vendor = row["Vendor"] ?? "";
  const productType = row["Type"] ?? "";
  const tags = row["Tags"] ? row["Tags"].split(",").map((t) => t.trim()).filter(Boolean) : [];
  const status = (row["Status"] ?? "").toUpperCase() || "ACTIVE";

  const variantPrice = row["Variant Price"] ?? "0";
  const compareAtPrice = row["Variant Compare At Price"] ?? undefined;
  const sku = row["Variant SKU"] ?? "";
  const inventoryQty = parseInt(row["Variant Inventory Qty"] ?? "0", 10) || 0;
  const inventoryPolicy = (row["Variant Inventory Policy"] ?? "deny").toUpperCase();
  const requiresShipping = (row["Variant Requires Shipping"] ?? "true").toLowerCase() !== "false";
  const taxable = (row["Variant Taxable"] ?? "true").toLowerCase() !== "false";
  const barcode = row["Variant Barcode"] ?? undefined;
  const imageUrl = row["Image Src"] ?? undefined;

  const input: Record<string, unknown> = {
    title,
    handle: handle || undefined,
    bodyHtml,
    vendor: vendor || undefined,
    productType: productType || undefined,
    tags,
    status: ["ACTIVE", "DRAFT", "ARCHIVED"].includes(status) ? status : "ACTIVE",
    variants: [
      {
        price: variantPrice,
        compareAtPrice: compareAtPrice || undefined,
        sku: sku || undefined,
        barcode: barcode || undefined,
        requiresShipping,
        taxable,
        inventoryManagement: "SHOPIFY",
        inventoryPolicy: inventoryPolicy === "CONTINUE" ? "CONTINUE" : "DENY",
        inventoryQuantities: [
          {
            availableQuantity: inventoryQty,
            locationId: "", // filled in per-shop below
          },
        ],
      },
    ],
  };

  if (imageUrl) {
    input.images = [{ src: imageUrl }];
  }

  return input;
}

// ------------------------------------------------------------------
// Get the default location ID for this shop
// ------------------------------------------------------------------
async function getDefaultLocationId(admin: any): Promise<string | null> {
  const response = await admin.graphql(`#graphql
    query {
      locations(first: 1) {
        edges {
          node { id }
        }
      }
    }
  `);
  const data = await response.json();
  return data?.data?.locations?.edges?.[0]?.node?.id ?? null;
}

// ------------------------------------------------------------------
// Action
// ------------------------------------------------------------------
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const csv = form.get("csv") as string;

  if (!csv) {
    return json({ ok: false, error: "No CSV provided" }, { status: 400 });
  }

  // Parse with header normalization
  const parsed = Papa.parse<ProductRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => normalizeHeader(h),
  });

  const rows = parsed.data;
  if (rows.length === 0) {
    return json({ ok: false, error: "CSV has no data rows" }, { status: 400 });
  }

  // Group rows by handle — each handle = one product (variant rows skip)
  const seenHandles = new Set<string>();
  const productRows: ProductRow[] = [];
  for (const row of rows) {
    const handle = (row["Handle"] ?? "").trim();
    if (!handle || seenHandles.has(handle)) continue;
    seenHandles.add(handle);
    productRows.push(row);
  }

  // Get default location for inventory
  const locationId = await getDefaultLocationId(admin);

  let created = 0;
  let failed = 0;
  const errors: { title: string; messages: string[] }[] = [];

  for (const row of productRows) {
    try {
      const input = rowToProductInput(row);

      // Inject real location ID into inventory quantities
      if (locationId && Array.isArray(input.variants)) {
        for (const v of input.variants as any[]) {
          if (v.inventoryQuantities?.[0]) {
            v.inventoryQuantities[0].locationId = locationId;
          }
        }
      }

      const response = await admin.graphql(PRODUCT_CREATE_MUTATION, {
        variables: { input },
      });

      const data = await response.json();
      const result = data?.data?.productCreate;

      if (result?.userErrors?.length > 0) {
        failed++;
        errors.push({
          title: row["Title"] ?? "Unknown",
          messages: result.userErrors.map((e: any) => `${e.field?.join(".") ?? ""}: ${e.message}`),
        });
      } else {
        created++;
      }
    } catch (err: any) {
      failed++;
      errors.push({
        title: row["Title"] ?? "Unknown",
        messages: [err.message ?? "Unknown error"],
      });
    }
  }

  return json({ ok: true, created, failed, errors });
};
