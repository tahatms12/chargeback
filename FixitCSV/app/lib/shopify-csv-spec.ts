export const REQUIRED_HEADERS = ["Handle", "Title", "Variant Price"];
export const BOOLEAN_FIELDS = ["Published", "Variant Requires Shipping", "Variant Taxable", "Gift Card"];
export const NUMERIC_FIELDS: Record<string, "decimal" | "integer"> = {
  "Variant Price": "decimal",
  "Variant Compare At Price": "decimal",
  "Variant Grams": "decimal",
  "Variant Inventory Qty": "integer",
  "Image Position": "integer",
};
export const ENUM_FIELDS: Record<string, string[]> = {
  "Variant Inventory Policy": ["deny", "continue"],
  "Variant Weight Unit": ["g", "kg", "lb", "oz"],
  Status: ["active", "draft", "archived"],
};
export const URL_FIELDS = ["Image Src", "Variant Image"];
export const ALL_KNOWN_HEADERS = [
  "Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published",
  "Option1 Name", "Option1 Value", "Option2 Name", "Option2 Value", "Option3 Name", "Option3 Value",
  "Variant SKU", "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Qty", "Variant Inventory Policy",
  "Variant Fulfillment Service", "Variant Price", "Variant Compare At Price", "Variant Requires Shipping", "Variant Taxable",
  "Variant Barcode", "Image Src", "Image Position", "Image Alt Text", "Gift Card", "Variant Image", "Variant Weight Unit", "Status",
  // Passthrough — stripped before final Shopify CSV output
  "id",
];
export const BARCODE_PATTERN = /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/;
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
export const URL_PATTERN = /^https?:\/\/.+/i;
export const FREE_TIER_ROW_LIMIT = 100;
export const PAID_PLAN_NAME = "FixitCSV Pro";
export const PAID_PLAN_PRICE = 7;

/**
 * Canonical output column order that Shopify's product CSV import expects.
 * Used when serializing enriched data back to CSV for download or push.
 */
export const SHOPIFY_EXPORT_COLUMNS = [
  "Handle", "Title", "Body (HTML)", "Vendor", "Type", "Tags", "Published",
  "Option1 Name", "Option1 Value", "Option2 Name", "Option2 Value", "Option3 Name", "Option3 Value",
  "Variant SKU", "Variant Grams", "Variant Inventory Tracker", "Variant Inventory Qty",
  "Variant Inventory Policy", "Variant Fulfillment Service", "Variant Price",
  "Variant Compare At Price", "Variant Requires Shipping", "Variant Taxable",
  "Variant Barcode", "Image Src", "Image Position", "Image Alt Text",
  "Gift Card", "Variant Image", "Variant Weight Unit", "Status",
] as const;

/**
 * Maps common alternate header formats (lowercase, underscore, WooCommerce, supplier exports, etc.)
 * to the official Shopify Title Case header. Keys are lowercased+trimmed for matching.
 */
export const HEADER_ALIAS_MAP: Record<string, string> = {
  // Core product fields
  id:                       "id",             // passthrough — stripped on output
  handle:                   "Handle",
  slug:                     "Handle",
  product_handle:           "Handle",
  url_handle:               "Handle",

  title:                    "Title",
  product_title:            "Title",
  name:                     "Title",
  product_name:             "Title",

  body_html:                "Body (HTML)",
  "body (html)":            "Body (HTML)",
  body:                     "Body (HTML)",
  description:              "Body (HTML)",
  product_description:      "Body (HTML)",
  content:                  "Body (HTML)",
  html_body:                "Body (HTML)",

  vendor:                   "Vendor",
  brand:                    "Vendor",
  manufacturer:             "Vendor",
  supplier:                 "Vendor",

  type:                     "Type",
  product_type:             "Type",
  category:                 "Type",
  product_category:         "Type",

  tags:                     "Tags",
  product_tags:             "Tags",
  labels:                   "Tags",

  published:                "Published",
  active:                   "Published",
  is_published:             "Published",
  status:                   "Status",
  product_status:           "Status",

  // Option fields
  option1_name:             "Option1 Name",
  option_1_name:            "Option1 Name",
  option1name:              "Option1 Name",
  option1_value:            "Option1 Value",
  option_1_value:           "Option1 Value",
  option1value:             "Option1 Value",
  option1:                  "Option1 Value",
  option2_name:             "Option2 Name",
  option_2_name:            "Option2 Name",
  option2name:              "Option2 Name",
  option2_value:            "Option2 Value",
  option_2_value:           "Option2 Value",
  option2value:             "Option2 Value",
  option2:                  "Option2 Value",
  option3_name:             "Option3 Name",
  option_3_name:            "Option3 Name",
  option3name:              "Option3 Name",
  option3_value:            "Option3 Value",
  option_3_value:           "Option3 Value",
  option3value:             "Option3 Value",
  option3:                  "Option3 Value",

  // Variant fields
  variant_sku:              "Variant SKU",
  sku:                      "Variant SKU",
  product_sku:              "Variant SKU",
  item_sku:                 "Variant SKU",
  "variant sku":            "Variant SKU",

  variant_grams:            "Variant Grams",
  weight_grams:             "Variant Grams",
  weight:                   "Variant Grams",
  grams:                    "Variant Grams",
  "variant grams":          "Variant Grams",

  variant_inventory_tracker: "Variant Inventory Tracker",
  inventory_tracker:        "Variant Inventory Tracker",

  variant_inventory_qty:    "Variant Inventory Qty",
  inventory_qty:            "Variant Inventory Qty",
  qty:                      "Variant Inventory Qty",
  quantity:                 "Variant Inventory Qty",
  stock:                    "Variant Inventory Qty",
  inventory:                "Variant Inventory Qty",
  "variant inventory qty":  "Variant Inventory Qty",

  variant_inventory_policy: "Variant Inventory Policy",
  inventory_policy:         "Variant Inventory Policy",
  "variant inventory policy": "Variant Inventory Policy",

  variant_fulfillment_service: "Variant Fulfillment Service",
  fulfillment_service:      "Variant Fulfillment Service",
  "variant fulfillment service": "Variant Fulfillment Service",

  variant_price:            "Variant Price",
  price:                    "Variant Price",
  regular_price:            "Variant Price",
  "variant price":          "Variant Price",

  variant_compare_at_price: "Variant Compare At Price",
  compare_at_price:         "Variant Compare At Price",
  compare_price:            "Variant Compare At Price",
  sale_price:               "Variant Compare At Price",
  original_price:           "Variant Compare At Price",
  msrp:                     "Variant Compare At Price",
  "variant compare at price": "Variant Compare At Price",

  variant_requires_shipping: "Variant Requires Shipping",
  requires_shipping:        "Variant Requires Shipping",
  "variant requires shipping": "Variant Requires Shipping",

  variant_taxable:          "Variant Taxable",
  taxable:                  "Variant Taxable",
  is_taxable:               "Variant Taxable",
  "variant taxable":        "Variant Taxable",

  variant_barcode:          "Variant Barcode",
  barcode:                  "Variant Barcode",
  upc:                      "Variant Barcode",
  ean:                      "Variant Barcode",
  isbn:                     "Variant Barcode",
  gtin:                     "Variant Barcode",
  "variant barcode":        "Variant Barcode",

  variant_weight_unit:      "Variant Weight Unit",
  weight_unit:              "Variant Weight Unit",
  "variant weight unit":    "Variant Weight Unit",

  variant_image:            "Variant Image",
  variant_image_src:        "Variant Image",
  "variant image":          "Variant Image",

  // Image fields
  image_src:                "Image Src",
  image_url:                "Image Src",
  image:                    "Image Src",
  photo:                    "Image Src",
  product_image:            "Image Src",
  thumbnail:                "Image Src",
  "image src":              "Image Src",

  image_position:           "Image Position",
  "image position":         "Image Position",

  image_alt_text:           "Image Alt Text",
  image_alt:                "Image Alt Text",
  alt_text:                 "Image Alt Text",
  "image alt text":         "Image Alt Text",

  // Other
  gift_card:                "Gift Card",
  "gift card":              "Gift Card",
  is_gift_card:             "Gift Card",
};

/**
 * Normalize a raw CSV header to its official Shopify Title Case equivalent.
 * Returns the original header trimmed if no alias is found.
 */
export function normalizeHeader(raw: string): string {
  const key = raw.trim().toLowerCase();
  return HEADER_ALIAS_MAP[key] ?? raw.trim();
}
