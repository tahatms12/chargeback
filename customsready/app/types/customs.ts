// app/types/customs.ts

export interface CommercialInvoiceData {
  orderId: string;
  orderName: string;
  orderDate: string;
  currency: string;
  sellerDetails: {
    name: string;
    address: string;
    email?: string;
    phone?: string;
  };
  buyerDetails: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province?: string;
    country: string;
    zip: string;
    email?: string;
  };
  lineItems: LineItemCustoms[];
  totalDeclaredValue: number;
}

export interface LineItemCustoms {
  title: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  weightGrams: number;
  hsCode: string;
  countryOfOrigin: string;
}

export interface DutyEstimate {
  dutyAmount: number;
  taxAmount: number;
  totalLandedCost: number;
  currency: "USD";
  dutyRate: number;
  taxRate: number;
  taxType: "VAT" | "GST" | "HST" | "IOSS_APPLICABLE" | "NONE";
  notes: string[];
}
