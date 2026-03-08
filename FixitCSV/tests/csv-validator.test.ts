import { describe, expect, it } from "vitest";
import { validateCsv } from "../app/lib/csv-validator.client";

describe("csv validator", () => {
  it("accepts minimal valid csv", () => {
    const r = validateCsv("Handle,Title,Variant Price\nmy-product,My Product,9.99");
    expect(r.headerErrors).toHaveLength(0);
    expect(r.errors).toHaveLength(0);
    expect(r.passed).toBe(true);
  });

  it("requires headers", () => {
    const r = validateCsv("Title,Variant Price\nMy Product,9.99");
    expect(r.headerErrors.some((e) => e.includes("Handle"))).toBe(true);
  });

  it("validates handle format", () => {
    const r = validateCsv("Handle,Title,Variant Price\nBad Handle,My Product,9.99");
    expect(r.errors.some((e) => e.column === "Handle")).toBe(true);
  });

  it("validates image src url", () => {
    const r = validateCsv("Handle,Title,Variant Price,Image Src\nmy-product,My Product,9.99,example.com/image.jpg");
    expect(r.errors.some((e) => e.column === "Image Src")).toBe(true);
  });

  it("validates barcode format", () => {
    const r = validateCsv("Handle,Title,Variant Price,Variant Barcode\nmy-product,My Product,9.99,1234");
    expect(r.errors.some((e) => e.column === "Variant Barcode")).toBe(true);
  });

  it("warns compare-at-price below variant price", () => {
    const r = validateCsv("Handle,Title,Variant Price,Variant Compare At Price\nmy-product,My Product,20,10");
    expect(r.warnings.some((w) => w.column === "Variant Compare At Price")).toBe(true);
  });

  it("flags utf-8 replacement char", () => {
    const r = validateCsv("Handle,Title,Variant Price\nmy-product,Bad  text �,10");
    expect(r.errors.some((e) => e.message.includes("UTF-8"))).toBe(true);
  });
});
