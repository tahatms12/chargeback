export const REQUIRED_HEADERS = ["Handle", "Title", "Variant Price"];
export const BOOLEAN_FIELDS = ["Published", "Variant Requires Shipping", "Variant Taxable", "Gift Card"];
export const NUMERIC_FIELDS: Record<string, "decimal" | "integer"> = {
  "Variant Price": "decimal",
  "Variant Compare At Price": "decimal",
  "Variant Grams": "decimal",
  "Variant Inventory Qty": "integer",
  "Image Position": "integer"
};
export const ENUM_FIELDS: Record<string, string[]> = {
  "Variant Inventory Policy": ["deny", "continue"],
  "Variant Weight Unit": ["g", "kg", "lb", "oz"],
  Status: ["active", "draft", "archived"]
};
export const URL_FIELDS = ["Image Src", "Variant Image"];
export const ALL_KNOWN_HEADERS = [
  "Handle","Title","Body (HTML)","Vendor","Type","Tags","Published",
  "Option1 Name","Option1 Value","Option2 Name","Option2 Value","Option3 Name","Option3 Value",
  "Variant SKU","Variant Grams","Variant Inventory Tracker","Variant Inventory Qty","Variant Inventory Policy",
  "Variant Fulfillment Service","Variant Price","Variant Compare At Price","Variant Requires Shipping","Variant Taxable",
  "Variant Barcode","Image Src","Image Position","Image Alt Text","Gift Card","Variant Image","Variant Weight Unit","Status"
];
export const BARCODE_PATTERN = /^\d{8}$|^\d{12}$|^\d{13}$|^\d{14}$/;
export const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]*$/;
export const URL_PATTERN = /^https?:\/\/.+/i;
export const FREE_TIER_ROW_LIMIT = 100;
export const PAID_PLAN_NAME = "FixitCSV Pro";
export const PAID_PLAN_PRICE = 7;
