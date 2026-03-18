// app/pdf/pdfUtils.ts
import { renderToBuffer as renderPDF } from "@react-pdf/renderer";
import type { ReactElement } from "react";

export async function renderToBuffer(element: ReactElement): Promise<Buffer> {
  // @react-pdf/renderer's renderToBuffer returns a Node Buffer or Uint8Array
  // We explicitly cast to Buffer or wrap it.
  const result = await renderPDF(element);
  return Buffer.isBuffer(result) ? result : Buffer.from(result);
}
