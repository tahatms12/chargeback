// app/lib/weight.ts

export function normalizeToGrams(weight: number, unit: string): number {
  const lowerUnit = unit.toUpperCase();
  switch (lowerUnit) {
    case "KILOGRAMS":
    case "KG":
      return weight * 1000;
    case "POUNDS":
    case "LB":
    case "LBS":
      return weight * 453.592;
    case "OUNCES":
    case "OZ":
      return weight * 28.3495;
    case "GRAMS":
    case "G":
    default:
      return weight;
  }
}

export function aggregateWeight(lineItems: { weight: number; weightUnit: string; quantity: number }[]): number {
  let totalGrams = 0;
  for (const item of lineItems) {
    const itemGrams = normalizeToGrams(item.weight || 0, item.weightUnit || "GRAMS");
    totalGrams += (itemGrams * (item.quantity || 1));
  }
  return totalGrams;
}
