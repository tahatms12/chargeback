import Papa from "papaparse";
import { ALL_KNOWN_HEADERS, BARCODE_PATTERN, BOOLEAN_FIELDS, ENUM_FIELDS, HANDLE_PATTERN, NUMERIC_FIELDS, REQUIRED_HEADERS, URL_FIELDS, URL_PATTERN, normalizeHeader } from "~/lib/shopify-csv-spec";
import type { Locale } from "~/lib/i18n";
import { translate } from "~/lib/i18n";

export type ValidationIssue = { row: number; column: string; severity: "error" | "warning"; message: string; fix: string };
export type ValidationResult = {
  totalRows: number;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  headerErrors: string[];
  unknownHeaders: string[];
  passed: boolean;
};

type Translate = (key: string, vars?: Record<string, string | number>) => string;

const isDecimal = (v: string) => /^\d+(\.\d+)?$/.test(v.trim());
const isInteger = (v: string) => /^-?\d+$/.test(v.trim());
const isBoolean = (v: string) => ["true", "false"].includes(v.trim().toLowerCase());

export function validateCsv(content: string, locale: Locale = "en", t: Translate = (key, vars) => translate(locale, key, vars)): ValidationResult {
  const result: ValidationResult = { totalRows: 0, errors: [], warnings: [], headerErrors: [], unknownHeaders: [], passed: false };

  // Normalize headers on parse — maps any alias format to official Shopify Title Case
  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => normalizeHeader(h),
  });
  const headers = parsed.meta.fields ?? [];

  for (const required of REQUIRED_HEADERS) {
    if (!headers.includes(required)) result.headerErrors.push(t("validation.missingRequiredColumn", { column: required }));
  }
  // Only flag headers as unknown if they're not a known Shopify header AND not a known alias
  for (const h of headers) if (!ALL_KNOWN_HEADERS.includes(h)) result.unknownHeaders.push(h);

  // Always count rows first so totalRows is correct even when header errors exist
  result.totalRows = parsed.data.length;
  if (result.headerErrors.length) return result;

  const rows = parsed.data;
  const firstSeen = new Map<string, number>();
  const handleOptionNames = new Map<string, { o1?: string; o2?: string; o3?: string }>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;
    const pushError = (column: string, message: string, fix: string) => result.errors.push({ row: rowNum, column, severity: "error", message, fix });
    const pushWarn = (column: string, message: string, fix: string) => result.warnings.push({ row: rowNum, column, severity: "warning", message, fix });

    for (const [column, value] of Object.entries(row)) {
      if ((value ?? "").includes("\uFFFD")) pushError(column, t("validation.utf8Issue"), t("validation.utf8Fix"));
    }

    const handle = (row["Handle"] ?? "").trim();
    const title = (row["Title"] ?? "").trim();
    const price = (row["Variant Price"] ?? "").trim();
    const isFirst = handle !== "" && !firstSeen.has(handle);

    if (handle === "") {
      pushError("Handle", t("validation.handleRequired"), t("validation.handleRequiredFix"));
    } else if (!HANDLE_PATTERN.test(handle)) {
      pushError("Handle", t("validation.invalidHandle", { handle }), t("validation.invalidHandleFix"));
    }

    if (isFirst) {
      firstSeen.set(handle, rowNum);
      handleOptionNames.set(handle, {
        o1: (row["Option1 Name"] ?? "").trim() || undefined,
        o2: (row["Option2 Name"] ?? "").trim() || undefined,
        o3: (row["Option3 Name"] ?? "").trim() || undefined
      });
      if (title === "") pushError("Title", t("validation.titleRequired"), t("validation.titleRequiredFix"));
    }

    if (price === "") pushError("Variant Price", t("validation.priceRequired"), t("validation.priceRequiredFix"));
    else if (!isDecimal(price)) pushError("Variant Price", t("validation.priceNumeric"), t("validation.priceNumericFix"));

    const compare = (row["Variant Compare At Price"] ?? "").trim();
    if (compare !== "") {
      if (!isDecimal(compare)) pushError("Variant Compare At Price", t("validation.compareNumeric"), t("validation.compareNumericFix"));
      else if (isDecimal(price) && parseFloat(compare) < parseFloat(price)) pushWarn("Variant Compare At Price", t("validation.compareLower"), t("validation.compareLowerFix"));
    }

    for (const field of BOOLEAN_FIELDS) {
      if (!headers.includes(field)) continue;
      const v = (row[field] ?? "").trim();
      if (v && !isBoolean(v)) pushError(field, t("validation.boolField", { field }), t("validation.boolFieldFix"));
    }

    for (const [field, numericType] of Object.entries(NUMERIC_FIELDS)) {
      if (!headers.includes(field) || field === "Variant Price" || field === "Variant Compare At Price") continue;
      const v = (row[field] ?? "").trim();
      if (!v) continue;
      if (numericType === "decimal" && !isDecimal(v)) pushError(field, t("validation.numericField", { field }), t("validation.numericFieldFix"));
      if (numericType === "integer" && !isInteger(v)) pushError(field, t("validation.integerField", { field }), t("validation.integerFieldFix"));
    }

    for (const [field, values] of Object.entries(ENUM_FIELDS)) {
      if (!headers.includes(field)) continue;
      const v = (row[field] ?? "").trim();
      if (v && !values.includes(v.toLowerCase())) pushError(field, t("validation.invalidEnum", { field }), t("validation.invalidEnumFix", { values: values.join(", ") }));
    }

    for (const field of URL_FIELDS) {
      if (!headers.includes(field)) continue;
      const v = (row[field] ?? "").trim();
      if (v && !URL_PATTERN.test(v)) pushError(field, t("validation.invalidUrl", { field }), t("validation.invalidUrlFix"));
    }

    const barcode = (row["Variant Barcode"] ?? "").trim();
    if (headers.includes("Variant Barcode") && barcode && !BARCODE_PATTERN.test(barcode)) {
      pushError("Variant Barcode", t("validation.invalidBarcode"), t("validation.invalidBarcodeFix"));
    }

    if (!isFirst && handle) {
      const optionDef = handleOptionNames.get(handle);
      if (optionDef?.o1 && !(row["Option1 Value"] ?? "").trim()) pushError("Option1 Value", t("validation.optionRequired", { field: "Option1 Value" }), t("validation.optionRequiredFix", { field: "Option1 Value", option: optionDef.o1 }));
      if (optionDef?.o2 && !(row["Option2 Value"] ?? "").trim()) pushError("Option2 Value", t("validation.optionRequired", { field: "Option2 Value" }), t("validation.optionRequiredFix", { field: "Option2 Value", option: optionDef.o2 }));
      if (optionDef?.o3 && !(row["Option3 Value"] ?? "").trim()) pushError("Option3 Value", t("validation.optionRequired", { field: "Option3 Value" }), t("validation.optionRequiredFix", { field: "Option3 Value", option: optionDef.o3 }));

      const prevHandle = (rows[i - 1]?.["Handle"] ?? "").trim();
      if (prevHandle !== handle && title) {
        pushWarn("Handle", t("validation.nonContiguousHandle"), t("validation.nonContiguousHandleFix"));
      }
    }
  }

  result.passed = result.headerErrors.length === 0 && result.errors.length === 0;
  return result;
}
