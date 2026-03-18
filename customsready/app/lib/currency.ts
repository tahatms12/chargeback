// app/lib/currency.ts

// Fallback hardcoded FX rates to USD
const FX_TO_USD: Record<string, number> = {
  USD: 1.0,
  EUR: 1.08,
  GBP: 1.25,
  CAD: 0.73,
  AUD: 0.65,
  JPY: 0.0066,
  CNY: 0.13,
  AED: 0.27,
  SAR: 0.26,
};

export function normalizeToUSD(amount: number, currencyCode: string): number {
  const code = currencyCode.toUpperCase();
  const rate = FX_TO_USD[code];
  if (rate) {
    return amount * rate;
  }
  return amount; // Fallback 1:1 if unknown
}
