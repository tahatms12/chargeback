import { GoogleGenerativeAI } from "@google/generative-ai";
import Papa from "papaparse";
import { validateCsv } from "./csv-validator.shared";
import type { Locale } from "./i18n";

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyB6bwtRflNcLMLzt4paDr4tBFEA_2zAEmQ";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function repairCsvWithGemini(csvContent: string, locale: Locale = "en"): Promise<string> {
  const result = validateCsv(csvContent, locale);
  if (result.passed) return csvContent;

  const parsed = Papa.parse<Record<string, string>>(csvContent, { header: true });
  const headers = parsed.meta.fields ?? [];
  const rows = parsed.data;

  const errorRowIndexes = new Set<number>();
  for (const err of result.errors) errorRowIndexes.add(err.row - 1);
  for (const warn of result.warnings) errorRowIndexes.add(warn.row - 1);

  if (errorRowIndexes.size === 0) return csvContent;

  const rowsToFix = Array.from(errorRowIndexes).map(i => rows[i]).filter(Boolean);
  if (rowsToFix.length === 0) return csvContent;

  const prompt = `You are an expert Shopify data migration assistant.
The following rows from a Shopify Product CSV have validation errors (such as missing handles, invalid prices, poor formatting, corrupted characters).
Repair them so they are completely valid for a Shopify product import.
Return ONLY the repaired CSV rows formatted as valid CSV Data, WITH NO markdown formatting, NO \`\`\`csv wrapper, and NO headers.
Ensure the column order exactly matches the provided headers.

Headers:
${headers.join(",")}

Broken Rows JSON:
${JSON.stringify(rowsToFix, null, 2)}
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const response = await model.generateContent(prompt);
    let fixedText = response.response.text().trim();
    
    // Strip possible markdown
    fixedText = fixedText.replace(/^```(csv)?\s*/i, "").replace(/\s*```$/i, "").trim();

    const fixedParsed = Papa.parse<string[]>(fixedText, { header: false });
    const fixedRows = fixedParsed.data;

    let fixedIndex = 0;
    for (const i of Array.from(errorRowIndexes)) {
      if (fixedRows[fixedIndex]) {
        const newRowObj: Record<string, string> = {};
        headers.forEach((h, idx) => {
          newRowObj[h] = fixedRows[fixedIndex][idx] ?? "";
        });
        rows[i] = newRowObj;
      }
      fixedIndex++;
    }

    return Papa.unparse(rows, { columns: headers });
  } catch (error) {
    console.error("Gemini repair failed:", error);
    throw error;
  }
}
