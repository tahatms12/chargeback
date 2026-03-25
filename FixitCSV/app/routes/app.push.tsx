import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import Papa from "papaparse";
import { authenticate } from "~/shopify.server";
import { normalizeHeader } from "~/lib/shopify-csv-spec";

// ---------------------------------------------------------------------------
// GraphQL mutations (Shopify Admin API 2025-01)
// ---------------------------------------------------------------------------

const PRODUCT_CREATE_MUTATION = `#graphql
  mutation productCreate($product: ProductCreateInput!, $media: [CreateMediaInput!]) {
    productCreate(product: $product, media: $media) {
      product {
        id
        title
        handle
        variants(first: 1) {
          edges {
            node {
              id
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const VARIANT_PRICE_MUTATION = `#graphql
  mutation productVariantsBulkUpdate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkUpdate(productId: $productId, variants: $variants) {
      productVariants {
        id
        price
      }
      userErrors {
        field
        message
      }
    }
  }
`;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProductRow = Record<string, string>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToProductCreateInput(row: ProductRow) {
  const title = (row["Title"] ?? "").trim();
  const handle = (row["Handle"] ?? "").trim() || undefined;
  const descriptionHtml = (row["Body (HTML)"] ?? "").trim() || undefined;
  const vendor = (row["Vendor"] ?? "").trim() || undefined;
  const productType = (row["Type"] ?? "").trim() || undefined;
  const rawTags = (row["Tags"] ?? "").trim();
  const tags = rawTags ? rawTags.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
  const rawStatus = (row["Status"] ?? "").trim().toUpperCase();
  const status = (["ACTIVE", "DRAFT", "ARCHIVED"].includes(rawStatus) ? rawStatus : "ACTIVE") as "ACTIVE" | "DRAFT" | "ARCHIVED";

  const product: Record<string, unknown> = { title, status };
  // Don't pass handle — let Shopify auto-generate it from the title.
  // This avoids "handle already in use" errors when previous push attempts left draft products.
  if (descriptionHtml) product.descriptionHtml = descriptionHtml;
  if (vendor) product.vendor = vendor;
  if (productType) product.productType = productType;
  if (tags?.length) product.tags = tags;

  // Media (images) — passed as separate top-level arg
  const imageSrc = (row["Image Src"] ?? "").trim();
  const media = imageSrc
    ? [{ originalSource: imageSrc, mediaContentType: "IMAGE" }]
    : undefined;

  return { product, media };
}

async function getDefaultLocationId(admin: any): Promise<string | null> {
  try {
    const res = await admin.graphql(`#graphql
      query { locations(first: 1) { edges { node { id } } } }
    `);
    const data = await res.json();
    return data?.data?.locations?.edges?.[0]?.node?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Action
// ---------------------------------------------------------------------------
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const form = await request.formData();
  const csv = form.get("csv") as string;

  if (!csv) return json({ ok: false, error: "No CSV provided" }, { status: 400 });

  const parsed = Papa.parse<ProductRow>(csv, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => normalizeHeader(h),
  });

  const rows = parsed.data;
  if (rows.length === 0) return json({ ok: false, error: "CSV has no data rows" }, { status: 400 });

  // Deduplicate by handle — first row per handle is the product
  const seenHandles = new Set<string>();
  const productRows: ProductRow[] = [];
  for (const row of rows) {
    const handle = (row["Handle"] ?? "").trim();
    if (!handle || seenHandles.has(handle)) continue;
    seenHandles.add(handle);
    productRows.push(row);
  }

  const locationId = await getDefaultLocationId(admin);

  let created = 0;
  let failed = 0;
  const errors: { title: string; messages: string[] }[] = [];

  for (const row of productRows) {
    try {
      const { product, media } = rowToProductCreateInput(row);

      // Step 1: Create the product
      const createRes = await admin.graphql(PRODUCT_CREATE_MUTATION, {
        variables: { product, ...(media ? { media } : {}) },
      });
      const createData = await createRes.json();
      const createResult = createData?.data?.productCreate;

      if (createResult?.userErrors?.length > 0) {
        failed++;
        errors.push({
          title: (row["Title"] ?? "Unknown").trim(),
          messages: createResult.userErrors.map((e: any) =>
            `${e.field?.join?.(".") ?? "field"}: ${e.message}`
          ),
        });
        continue;
      }

      const productId = createResult?.product?.id;
      const variantId = createResult?.product?.variants?.edges?.[0]?.node?.id;

      // Step 2: Update variant price + inventory if we have a variant ID
      if (productId && variantId) {
        const price = (row["Variant Price"] ?? "0").trim();
        const compareAtPrice = (row["Variant Compare At Price"] ?? "").trim() || undefined;
        const sku = (row["Variant SKU"] ?? "").trim() || undefined;
        const barcode = (row["Variant Barcode"] ?? "").trim() || undefined;
        const requiresShipping = (row["Variant Requires Shipping"] ?? "true").toLowerCase() !== "false";
        const taxable = (row["Variant Taxable"] ?? "true").toLowerCase() !== "false";
        const inventoryQty = parseInt(row["Variant Inventory Qty"] ?? "0", 10) || 0;

        // Build inventory item (sku + requires shipping live here per schema)
        const inventoryItem: Record<string, unknown> = { requiresShipping };
        if (sku) inventoryItem.sku = sku;

        const variantInput: Record<string, unknown> = {
          id: variantId,
          price,
          taxable,
          inventoryItem,
        };
        if (compareAtPrice) variantInput.compareAtPrice = compareAtPrice;
        if (barcode) variantInput.barcode = barcode;
        // Note: inventory quantity is not set here — merchants adjust stock in Shopify after import


        await admin.graphql(VARIANT_PRICE_MUTATION, {
          variables: { productId, variants: [variantInput] },
        });
      }

      created++;
    } catch (err: any) {
      failed++;
      errors.push({
        title: (row["Title"] ?? "Unknown").trim(),
        messages: [err.message ?? "Unknown error"],
      });
    }
  }

  return json({ ok: true, created, failed, errors });
};
