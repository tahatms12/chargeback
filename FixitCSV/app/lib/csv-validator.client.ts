import Papa from "papaparse";
import { ALL_KNOWN_HEADERS, BARCODE_PATTERN, BOOLEAN_FIELDS, ENUM_FIELDS, HANDLE_PATTERN, NUMERIC_FIELDS, REQUIRED_HEADERS, URL_FIELDS, URL_PATTERN } from "~/lib/shopify-csv-spec";

export type ValidationIssue = { row: number; column: string; severity: "error" | "warning"; message: string; fix: string };
export type ValidationResult = {
  totalRows: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  headerErrors: string[];
  unknownHeaders: string[];
  passed: boolean;
};

const isDecimal = (v: string) => /^\d+(\.\d+)?$/.test(v.trim());
const isInteger = (v: string) => /^-?\d+$/.test(v.trim());
const isBoolean = (v: string) => ["true", "false"].includes(v.trim().toLowerCase());

export function validateCsv(content: string): ValidationResult {
  const result: ValidationResult = { totalRows: 0, errors: [], warnings: [], headerErrors: [], unknownHeaders: [], passed: false };
  const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true, transformHeader: (h) => h.trim() });
  const headers = parsed.meta.fields ?? [];

  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) result.headerErrors.push(`Missing required column: \"${required}\".`);
  }
  for (const h of headers) if (!ALL_KNOWN_HEADERS.includes(h)) result.unknownHeaders.push(h);
  if (result.headerErrors.length) return result;

  const rows = parsed.data;
  result.totalRows = rows.length;
  const firstSeen = new Map<string, number>();
  const handleOptionNames = new Map<string, { o1?: string; o2?: string; o3?: string }>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const pushError = (column: string, message: string, fix: string) => result.errors.push({ row: rowNum, column, severity: "error", message, fix });
    const pushWarn = (column: string, message: string, fix: string) => result.warnings.push({ row: rowNum, column, severity: "warning", message, fix });

    for (const [column, value] of Object.entries(row)) {
      if ((value ?? "").includes("\uFFFD")) pushError(column, "Potential UTF-8 encoding issue detected.", "Re-save the CSV in UTF-8 format.");
    }

    const handle = (row["Handle"] ?? "").trim();
    const title = (row["Title"] ?? "").trim();
    const price = (row["Variant Price"] ?? "").trim();
    const isFirst = handle !== "" && !firstSeen.has(handle);

    if (handle === "") {
      pushError("Handle", "Handle is required.", "Add a non-empty handle.");
    } else if (!HANDLE_PATTERN.test(handle)) {
      pushError("Handle", `Invalid handle \"${handle}\".`, "Use lowercase letters, numbers, and hyphens only.");
    }

    if (isFirst) {
      firstSeen.set(handle, rowNum);
      handleOptionNames.set(handle, {
        o1: (row["Option1 Name"] ?? "").trim() || undefined,
        o2: (row["Option2 Name"] ?? "").trim() || undefined,
        o3: (row["Option3 Name"] ?? "").trim() || undefined
      });
      if (title === "") pushError("Title", "Title is required on the first row of each handle group.", "Add Title on the first row for this Handle.");
    }

    if (price === "") pushError("Variant Price", "Variant Price is required.", "Add a numeric Variant Price.");
    else if (!isDecimal(price)) pushError("Variant Price", "Variant Price must be numeric.", "Use a plain number like 19.99.");

    const compare = (row["Variant Compare At Price"] ?? "").trim();
    if (compare !== "") {
      if (!isDecimal(compare)) pushError("Variant Compare At Price", "Compare At Price must be numeric.", "Use a plain number or leave blank.");
      else if (isDecimal(price) && parseFloat(compare) < parseFloat(price)) pushWarn("Variant Compare At Price", "Compare At Price is lower than Variant Price.", "Set Compare At Price above Variant Price or clear it.");
    }

    for (const field of BOOLEAN_FIELDS) {
      if (!headers.includes(field)) continue;
      const v = (row[field] ?? "").trim();
      if (v && !isBoolean(v)) pushError(field, `${field} must be TRUE or FALSE.`, "Set to TRUE or FALSE.");
    }

    for (const [field, t] of Object.entries(NUMERIC_FIELDS)) {
      if (!headers.includes(field) || field === "Variant Price" || field === "Variant Compare At Price") continue;
      const v = (row[field] ?? "").trim();
      if (!v) continue;
      if (t === "decimal" && !isDecimal(v)) pushError(field, `${field} must be numeric.`, "Use a numeric value.");
      if (t === "integer" && !isInteger(v)) pushError(field, `${field} must be a whole number.`, "Use an integer.");
    }

    for (const [field, values] of Object.entries(ENUM_FIELDS)) {
      if (!headers.includes(field)) continue;
      const v = (row[field] ?? "").trim();
      if (v && !values.includes(v.toLowerCase())) pushError(field, `${field} contains an invalid value.`, `Use one of: ${values.join(", ")}.`);
    }

    for (const field of URL_FIELDS) {
      if (!headers.includes(field)) continue;
      const v = (row[field] ?? "").trim();
      if (v && !URL_PATTERN.test(v)) pushError(field, `${field} must be a valid URL.`, "Use a full http:// or https:// URL.");
    }

    const barcode = (row["Variant Barcode"] ?? "").trim();
    if (headers.includes("Variant Barcode") && barcode && !BARCODE_PATTERN.test(barcode)) {
      pushError("Variant Barcode", "Barcode must be GTIN-8/12/13/14 digits.", "Use only digits with 8, 12, 13, or 14 length.");
    }

    if (!isFirst && handle) {
      const optionDef = handleOptionNames.get(handle);
      if (optionDef?.o1 && !(row["Option1 Value"] ?? "").trim()) pushError("Option1 Value", "Option1 Value required for variant rows.", `Provide Option1 Value for ${optionDef.o1}.`);
      if (optionDef?.o2 && !(row["Option2 Value"] ?? "").trim()) pushError("Option2 Value", "Option2 Value required for variant rows.", `Provide Option2 Value for ${optionDef.o2}.`);
      if (optionDef?.o3 && !(row["Option3 Value"] ?? "").trim()) pushError("Option3 Value", "Option3 Value required for variant rows.", `Provide Option3 Value for ${optionDef.o3}.`);

      const prevHandle = (rows[i - 1]?.["Handle"] ?? "").trim();
      if (prevHandle !== handle && title) {
        pushWarn("Handle", "Handle group appears non-contiguous.", "Keep rows for a given handle grouped together.");
      }
    }
  }

  result.passed = result.headerErrors.length === 0 && result.errors.length === 0;
  return result;
}
