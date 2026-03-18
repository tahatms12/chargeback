// app/lib/hsCodes.ts

const HS_CODE_DATASET: Record<string, string> = {
  "t-shirt": "6109.10",
  "shirt": "6205.20",
  "pants": "6203.42",
  "jeans": "6203.42",
  "jacket": "6201.30",
  "coat": "6201.12",
  "sweater": "6110.20",
  "hoodie": "6110.20",
  "dress": "6204.42",
  "skirt": "6204.52",
  "shorts": "6203.42",
  "swimwear": "6211.11",
  "underwear": "6207.11",
  "socks": "6115.95",
  "shoes": "6403.99",
  "sneakers": "6404.11",
  "boots": "6403.91",
  "sandals": "6402.99",
  "hat": "6505.00",
  "cap": "6505.00",
  "gloves": "6216.00",
  "scarf": "6214.90",
  "belt": "4203.30",
  "bag": "4202.21",
  "backpack": "4202.92",
  "wallet": "4202.31",
  "sunglasses": "9004.10",
  "jewelry": "7113.19",
  "ring": "7113.19",
  "necklace": "7113.19",
  "bracelet": "7113.19",
  "earrings": "7113.19",
  "watch": "9102.11",
  "phone": "8517.12",
  "laptop": "8471.30",
  "tablet": "8471.30",
  "camera": "8525.80",
  "headphones": "8518.30",
  "speaker": "8518.21",
  "tv": "8528.72",
  "keyboard": "8471.60",
  "mouse": "8471.60",
  "book": "4901.99",
  "magazine": "4902.90",
  "poster": "4911.91",
  "painting": "9701.10",
  "toy": "9503.00",
  "board game": "9504.90",
  "puzzle": "9503.00",
  "action figure": "9503.00",
  "mug": "6912.00",
  "glass": "7013.41",
  "plate": "6912.00",
  "bowl": "6912.00",
  "cutlery": "8215.20",
  "furniture": "9403.60",
  "chair": "9401.61",
  "table": "9403.60",
  "bed": "9403.50",
  "sofa": "9401.61",
  "rug": "5703.20",
  "pillow": "9404.90",
  "blanket": "6301.30",
  "towel": "6302.60",
  "soap": "3401.11",
  "shampoo": "3305.10",
  "lotion": "3304.99",
  "makeup": "3304.99",
  "perfume": "3303.00",
  "candle": "3406.00",
};

export function lookupHsCode(title: string, description?: string): string | null {
  const combinedText = (title + " " + (description || "")).toLowerCase();
  
  for (const [keyword, hsCode] of Object.entries(HS_CODE_DATASET)) {
    // Basic word boundary match to avoid partial matches like "coat" in "coating"
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(combinedText)) {
      return hsCode;
    }
  }

  return null;
}
