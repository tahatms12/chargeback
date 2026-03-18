// app/lib/dutyCalc.ts
import { DUTY_RATES, DEFAULT_DUTY_RATE } from "~/data/dutyRates";
import { normalizeToUSD } from "./currency";
import type { DutyEstimate } from "~/types/customs";

const EU_MEMBER_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE"
]);

export function calculateDuties(
  destinationCountry: string,
  hsCode: string,
  declaredValueLocal: number,
  currencyCode: string,
  quantity: number
): DutyEstimate {
  // 1. Normalize declared value to USD
  const declaredValueUSD = normalizeToUSD(declaredValueLocal, currencyCode);

  // 2. Determine Duty Rate
  const countryCode = destinationCountry.toUpperCase();
  const countryRates = DUTY_RATES[countryCode];
  
  let dutyRate = DEFAULT_DUTY_RATE;
  let estimatedDutyNote = "Estimated duty rate — verify with carrier";

  if (countryRates) {
    // Try to match 6, 4, or 2 digits of the HS Code
    const prefix6 = hsCode.replace(/\./g, "").substring(0, 6);
    const prefix4 = hsCode.replace(/\./g, "").substring(0, 4);
    const prefix2 = hsCode.replace(/\./g, "").substring(0, 2);

    if (countryRates[prefix6] !== undefined) {
      dutyRate = countryRates[prefix6];
      estimatedDutyNote = `Found exact duty rate match: ${(dutyRate * 100).toFixed(1)}%`;
    } else if (countryRates[prefix4] !== undefined) {
      dutyRate = countryRates[prefix4];
      estimatedDutyNote = `Found 4-digit duty rate match: ${(dutyRate * 100).toFixed(1)}%`;
    } else if (countryRates[prefix2] !== undefined) {
      dutyRate = countryRates[prefix2];
      estimatedDutyNote = `Found 2-digit duty rate match: ${(dutyRate * 100).toFixed(1)}%`;
    }
  }

  // Calculate duty
  let dutyAmountUSD = declaredValueUSD * dutyRate;
  
  // 3. Tax / VAT Logic
  let taxRate = 0;
  let taxType: DutyEstimate["taxType"] = "NONE";
  let taxAmountUSD = 0;
  const notes: string[] = [estimatedDutyNote];

  if (EU_MEMBER_CODES.has(countryCode)) {
    // EU VAT Approximation
    // €150 is approx $162 USD (based on our 1.08 exchange rate)
    if (declaredValueUSD <= 162) {
      taxType = "IOSS_APPLICABLE";
      taxRate = 0.20; // Avg 20%
      notes.push("IOSS applicable for <= €150. VAT expected at checkout.");
    } else {
      taxType = "VAT";
      taxRate = 0.20; // Example 20% default for EU > €150
      notes.push("Import VAT applies at destination");
    }
    taxAmountUSD = (declaredValueUSD + dutyAmountUSD) * taxRate;
    
  } else if (countryCode === "GB") {
    // GB VAT Logic
    // £135 threshold is approx $168 USD
    if (declaredValueUSD <= 168) {
      // Duty free
      dutyRate = 0;
      dutyAmountUSD = 0;
      notes.push("Below £135 threshold: duty-free.");
    }
    taxType = "VAT";
    taxRate = 0.20;
    taxAmountUSD = (declaredValueUSD + dutyAmountUSD) * taxRate;

  } else if (countryCode === "CA") {
    // Canada Logic
    taxType = "GST";
    taxRate = 0.05;
    taxAmountUSD = (declaredValueUSD + dutyAmountUSD) * taxRate;
    notes.push("PROVINCE_DEPENDENT — HST/PST not calculated exactly.");
    // De minimis $20 CAD => $14.6 USD
    if (declaredValueUSD <= 14.6) {
      dutyRate = 0;
      dutyAmountUSD = 0;
      taxRate = 0;
      taxAmountUSD = 0;
      taxType = "NONE";
      notes.push("Below $20 CAD de minimis threshold");
    }

  } else if (countryCode === "AU") {
    // Australia Logic
    // $1000 AUD => ~$650 USD
    if (declaredValueUSD <= 650) {
      dutyRate = 0;
      dutyAmountUSD = 0;
      taxRate = 0;
      taxAmountUSD = 0;
      taxType = "NONE";
      notes.push("Below $1000 AUD de minimis threshold");
    } else {
      taxType = "GST";
      taxRate = 0.10;
      taxAmountUSD = (declaredValueUSD + dutyAmountUSD) * taxRate;
    }
  } else if (countryCode === "US") {
    // US Logic
    // $800 USD threshold
    if (declaredValueUSD <= 800) {
      dutyRate = 0;
      dutyAmountUSD = 0;
      taxRate = 0;
      taxAmountUSD = 0;
      taxType = "NONE";
      notes.push("Below $800 USD de minimis threshold");
    }
  }

  const totalLandedCostUSD = declaredValueUSD + dutyAmountUSD + taxAmountUSD;

  return {
    dutyAmount: Math.round(dutyAmountUSD * 100) / 100,
    taxAmount: Math.round(taxAmountUSD * 100) / 100,
    totalLandedCost: Math.round(totalLandedCostUSD * 100) / 100,
    currency: "USD",
    dutyRate,
    taxRate,
    taxType,
    notes,
  };
}
