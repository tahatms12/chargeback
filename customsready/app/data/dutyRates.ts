// app/data/dutyRates.ts

/**
 * Static dummy table for duty rates based on country and HS code prefix.
 * A 5% default rate is used where there is no specific match.
 * Structure: Record<countryCode, Record<hsCodePrefix, dutyRatePct>>
 */
export const DUTY_RATES: Record<string, Record<string, number>> = {
  US: {
    "61": 0.16, // Apparel
    "62": 0.16,
    "64": 0.08, // Footwear
    "95": 0.00, // Toys
    "85": 0.03, // Electronics
  },
  GB: {
    "61": 0.12,
    "62": 0.12,
    "64": 0.08,
    "85": 0.05,
  },
  CA: {
    "61": 0.18,
    "62": 0.18,
    "64": 0.10,
    "85": 0.05,
  },
  AU: {
    "61": 0.05,
    "62": 0.05,
  },
  DE: {
    "61": 0.12,
    "62": 0.12,
  },
  FR: {
    "61": 0.12,
  },
  NL: {
    "61": 0.12,
  },
  JP: {
    "61": 0.09,
    "62": 0.09,
  },
  AE: {
    "61": 0.05,
  },
  SA: {
    "61": 0.05,
  },
};

export const DEFAULT_DUTY_RATE = 0.05;
