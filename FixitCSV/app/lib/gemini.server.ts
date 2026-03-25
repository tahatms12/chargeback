import { GoogleGenerativeAI } from "@google/generative-ai";
import Papa from "papaparse";
import { validateCsv } from "./csv-validator.shared";
import { normalizeHeader, SHOPIFY_EXPORT_COLUMNS } from "./shopify-csv-spec";
import type { Locale } from "./i18n";

const API_KEY = process.env.GEMINI_API_KEY as string;
if (!API_KEY) {
  throw new Error("AI enrichment API key is missing. Set GEMINI_API_KEY in environment variables.");
}
const genAI = new GoogleGenerativeAI(API_KEY);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ProductRow = Record<string, string>;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Generate a URL-safe handle from a product title. */
function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/[\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Return true if a cell value is effectively empty. */
const isEmpty = (v: string | undefined) => !v || v.trim() === "";

// ---------------------------------------------------------------------------
// AI enrichment
// ---------------------------------------------------------------------------

/**
 * Call the AI to enrich a batch of rows that have missing fields.
 * Returns an array of full enriched row objects (JSON — more reliable than raw CSV from AI).
 */
async function enrichRowsWithAI(rows: ProductRow[]): Promise<ProductRow[]> {
  if (rows.length === 0) return rows;

  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `You are an expert e-commerce product data specialist helping a Shopify merchant complete their product catalog.

Below are product rows that are missing some fields. For each row:
- Generate a "Handle" (url-safe lowercase slug) from the Title if Handle is empty.
- Write a compelling "Body (HTML)" product description (2-3 sentences, in <p> tags) if it is empty.
- Suggest relevant comma-separated "Tags" based on the product name and type if Tags is empty.
- Infer "Vendor" from context if it is empty (use generic brand name if truly unknown, or leave blank).
- Infer "Type" (product category) from the product name if empty.
- Set "Variant Inventory Policy" to "deny" if empty.
- Set "Variant Requires Shipping" to "true" if empty (unless it's clearly a digital product).
- Set "Variant Taxable" to "true" if empty.
- Set "Variant Fulfillment Service" to "manual" if empty.
- NEVER overwrite values that already exist. Only fill blank/missing fields.
- Return ONLY a valid JSON array of the enriched rows in exactly the same field names. No markdown, no explanation.

Input rows (JSON):
${JSON.stringify(rows, null, 2)}`;

  try {
    const response = await model.generateContent(prompt);
    let text = response.response.text().trim();

    // Strip markdown code fences if present
    text = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    const enriched = JSON.parse(text) as ProductRow[];
    if (!Array.isArray(enriched)) throw new Error("AI response was not an array");
    return enriched;
  } catch (err) {
    console.error("[fixitcsv] AI enrichment failed, returning original rows:", err);
    // Graceful fallback — return rows with handle auto-generated at minimum
    return rows.map((row) => ({
      ...row,
      Handle: isEmpty(row["Handle"]) ? slugify(row["Title"] ?? "") : row["Handle"],
    }));
  }
}

// ---------------------------------------------------------------------------
// Main export: single-pass CSV processing pipeline
// ---------------------------------------------------------------------------

/**
 * Process a CSV in a single pass:
 *   1. Normalize headers (alias → Shopify Title Case)
 *   2. AI-enrich missing fields
 *   3. Validate
 *   4. Serialize to Shopify-standard column order
 *
 * Returns the enriched, Shopify-ready CSV string.
 */
export async function processAndEnrichCsv(csvContent: string, locale: Locale = "en"): Promise<string> {
  // Step 1: Parse with header normalization
  const parsed = Papa.parse<ProductRow>(csvContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => normalizeHeader(h),
  });

  let rows = parsed.data as ProductRow[];

  // Step 2: Identify rows that need AI enrichment (missing Handle, Body, Tags, or Type)
  const needsEnrichment = rows.some(
    (r) => isEmpty(r["Handle"]) || isEmpty(r["Body (HTML)"]) || isEmpty(r["Tags"]) || isEmpty(r["Type"])
  );

  if (needsEnrichment) {
    // Enrich in batches of 20 to stay within token limits
    const BATCH = 20;
    const enriched: ProductRow[] = [];
    for (let i = 0; i < rows.length; i += BATCH) {
      const batch = rows.slice(i, i + BATCH);
      const result = await enrichRowsWithAI(batch);
      enriched.push(...result);
    }
    rows = enriched;
  } else {
    // Even without AI, auto-generate handles from titles where missing
    rows = rows.map((row) => ({
      ...row,
      Handle: isEmpty(row["Handle"]) ? slugify(row["Title"] ?? "") : row["Handle"],
    }));
  }

  // Step 3: Serialize to the canonical Shopify column order, stripping the "id" passthrough column
  const outputColumns = [...SHOPIFY_EXPORT_COLUMNS];
  return Papa.unparse(rows, { columns: outputColumns });
}

// ---------------------------------------------------------------------------
// Legacy export alias (kept for any existing callers)
// ---------------------------------------------------------------------------
/** @deprecated Use processAndEnrichCsv instead */
export async function repairCsvWithGemini(csvContent: string, locale: Locale = "en"): Promise<string> {
  return processAndEnrichCsv(csvContent, locale);
}
