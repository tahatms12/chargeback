// app/lib/pdf.server.ts
import puppeteer, { type Browser } from "puppeteer";
import type { Configuration } from "@prisma/client";
import type { OrderNode, OrderLineItemNode } from "./graphql.server";
import { logger } from "./logger.server";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface InvoiceLineItem {
  title: string;
  quantity: number;
  unitValue: string;
  lineTotal: string;
  hsCode: string | null;
  countryOfOrigin: string | null;
  isCustomItem: boolean;
  isMissingHs: boolean;
  isMissingCoo: boolean;
}

export interface InvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  currency: string;
  seller: {
    name: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateProvince?: string;
    postalCode: string;
    countryCode: string;
    email?: string;
    phone?: string;
  };
  buyer: {
    name: string;
    company?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    province?: string;
    zip: string;
    country: string;
    phone?: string;
  };
  lineItems: InvoiceLineItem[];
  declaredTotal: string;
  shippingTotal?: string;
  completenessStatus: "complete" | "partial" | "not_ready";
}

// ─── Data preparation ─────────────────────────────────────────────────────────

export function buildInvoiceData(
  order: OrderNode,
  config: Configuration | null
): InvoiceData {
  const currency = order.currencyCode;
  const addr = order.shippingAddress;

  // Seller defaults when config is incomplete
  const seller = {
    name: config?.sellerName ?? "[SELLER NAME REQUIRED]",
    addressLine1: config?.sellerAddressLine1 ?? "[ADDRESS REQUIRED]",
    addressLine2: config?.sellerAddressLine2 ?? undefined,
    city: config?.sellerCity ?? "",
    stateProvince: config?.sellerStateProvince ?? undefined,
    postalCode: config?.sellerPostalCode ?? "",
    countryCode: config?.sellerCountryCode ?? "",
    email: config?.sellerContactEmail ?? undefined,
    phone: config?.sellerContactPhone ?? undefined,
  };

  const buyerName = [addr?.firstName, addr?.lastName].filter(Boolean).join(" ") || "[BUYER NAME]";
  const buyer = {
    name: buyerName,
    company: addr?.company ?? undefined,
    addressLine1: addr?.address1 ?? "",
    addressLine2: addr?.address2 ?? undefined,
    city: addr?.city ?? "",
    province: addr?.province ?? undefined,
    zip: addr?.zip ?? "",
    country: addr?.country ?? "",
    phone: addr?.phone ?? undefined,
  };

  // Build line items
  const lineItems: InvoiceLineItem[] = order.lineItems.nodes.map(
    (line: OrderLineItemNode) => {
      const isCustomItem = line.variant === null;
      const hsCode = line.variant?.inventoryItem?.harmonizedSystemCode ?? null;
      const coo = line.variant?.inventoryItem?.countryCodeOfOrigin ?? null;
      const isMissingHs = !hsCode;
      const isMissingCoo = !coo;

      const unitValue = line.discountedUnitPriceSet.shopMoney.amount;
      const lineTotal = (
        parseFloat(unitValue) * line.quantity
      ).toFixed(2);

      return {
        title: line.title,
        quantity: line.quantity,
        unitValue,
        lineTotal,
        hsCode,
        countryOfOrigin: coo,
        isCustomItem,
        isMissingHs,
        isMissingCoo,
      };
    }
  );

  // Completeness status
  const hasAnyMissing = lineItems.some((l) => l.isMissingHs || l.isMissingCoo);
  const allMissing = lineItems.every((l) => l.isMissingHs || l.isMissingCoo);
  const completenessStatus = !hasAnyMissing
    ? "complete"
    : allMissing
    ? "not_ready"
    : "partial";

  // Shipping total
  const shippingTotal =
    order.shippingLines?.nodes
      .reduce(
        (sum, sl) => sum + parseFloat(sl.originalPriceSet.shopMoney.amount),
        0
      )
      .toFixed(2) ?? undefined;

  return {
    invoiceNumber: order.name,
    invoiceDate: new Date(order.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    currency,
    seller,
    buyer,
    lineItems,
    declaredTotal: order.totalPriceSet.shopMoney.amount,
    shippingTotal,
    completenessStatus,
  };
}

// ─── HTML template ────────────────────────────────────────────────────────────

function renderInvoiceHtml(data: InvoiceData): string {
  const esc = (s: string | null | undefined) =>
    (s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const lineRows = data.lineItems
    .map((item) => {
      const hsDisplay = item.isMissingHs
        ? `<span class="missing">[HS CODE REQUIRED]</span>`
        : esc(item.hsCode);
      const cooDisplay = item.isMissingCoo
        ? `<span class="missing">[COO REQUIRED]</span>`
        : esc(item.countryOfOrigin);
      const rowClass = item.isMissingHs || item.isMissingCoo ? ' class="row-warning"' : "";

      return `
        <tr${rowClass}>
          <td class="desc">${esc(item.title)}${item.isCustomItem ? ' <span class="tag">Custom</span>' : ""}</td>
          <td class="center">${item.quantity}</td>
          <td class="right">${esc(item.currency ?? data.currency)} ${esc(item.unitValue)}</td>
          <td class="right">${esc(item.currency ?? data.currency)} ${esc(item.lineTotal)}</td>
          <td class="center">${hsDisplay}</td>
          <td class="center">${cooDisplay}</td>
        </tr>`;
    })
    .join("");

  const warningBanner =
    data.completenessStatus !== "complete"
      ? `<div class="warning-banner">
          ⚠ This invoice contains incomplete customs data. Items marked
          <span class="missing">[HS CODE REQUIRED]</span> or
          <span class="missing">[COO REQUIRED]</span> must be completed
          before filing with customs authorities.
        </div>`
      : "";

  const sellerAddr = [
    data.seller.addressLine1,
    data.seller.addressLine2,
    [data.seller.city, data.seller.stateProvince, data.seller.postalCode]
      .filter(Boolean)
      .join(", "),
    data.seller.countryCode,
  ]
    .filter(Boolean)
    .map(esc)
    .join("<br>");

  const buyerAddr = [
    data.buyer.company,
    data.buyer.addressLine1,
    data.buyer.addressLine2,
    [data.buyer.city, data.buyer.province, data.buyer.zip]
      .filter(Boolean)
      .join(", "),
    data.buyer.country,
  ]
    .filter(Boolean)
    .map(esc)
    .join("<br>");

  const shippingRow = data.shippingTotal
    ? `<tr>
        <td colspan="5" class="right sub-label">Shipping</td>
        <td class="right">${esc(data.currency)} ${esc(data.shippingTotal)}</td>
       </tr>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Commercial Invoice ${esc(data.invoiceNumber)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Helvetica Neue', Arial, Helvetica, sans-serif;
      font-size: 11px;
      color: #1a1a1a;
      background: #fff;
      padding: 0;
    }
    .page {
      padding: 36px 48px 48px;
      max-width: 860px;
      margin: 0 auto;
    }
    /* Header */
    .doc-title {
      font-size: 24px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #111;
      margin-bottom: 4px;
    }
    .doc-subtitle {
      font-size: 10px;
      color: #666;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #111;
      padding-bottom: 20px;
      margin-bottom: 24px;
    }
    .header-left {}
    .header-right {
      text-align: right;
    }
    .meta-table td {
      padding: 2px 0 2px 24px;
      vertical-align: top;
    }
    .meta-table td:first-child {
      color: #666;
      font-weight: 600;
      text-transform: uppercase;
      font-size: 9px;
      letter-spacing: 0.04em;
      padding-left: 0;
    }
    .meta-table td:last-child {
      font-weight: 600;
      font-size: 11px;
    }
    /* Addresses */
    .addresses {
      display: flex;
      gap: 40px;
      margin-bottom: 28px;
    }
    .address-block {
      flex: 1;
    }
    .address-block h3 {
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #666;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 4px;
      margin-bottom: 8px;
    }
    .address-block p {
      font-size: 11px;
      line-height: 1.6;
    }
    .address-block .contact {
      font-size: 10px;
      color: #555;
      margin-top: 6px;
    }
    /* Warning banner */
    .warning-banner {
      background: #fffbeb;
      border: 1px solid #f59e0b;
      border-radius: 4px;
      padding: 10px 14px;
      font-size: 10px;
      color: #92400e;
      margin-bottom: 20px;
      line-height: 1.5;
    }
    /* Line items table */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    .items-table thead tr {
      background: #111;
      color: #fff;
    }
    .items-table thead th {
      padding: 8px 10px;
      font-size: 9px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .items-table tbody tr {
      border-bottom: 1px solid #e5e7eb;
    }
    .items-table tbody tr:nth-child(even) {
      background: #f9fafb;
    }
    .items-table tbody tr.row-warning {
      background: #fffbeb;
    }
    .items-table td {
      padding: 8px 10px;
      vertical-align: top;
      line-height: 1.4;
    }
    .items-table th.center, .items-table td.center { text-align: center; }
    .items-table th.right, .items-table td.right { text-align: right; }
    .desc { max-width: 240px; }
    .tag {
      display: inline-block;
      font-size: 8px;
      font-weight: 700;
      background: #e0e7ff;
      color: #3730a3;
      border-radius: 3px;
      padding: 1px 5px;
      margin-left: 4px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      vertical-align: middle;
    }
    .missing {
      font-weight: 700;
      color: #dc2626;
      font-size: 9px;
      letter-spacing: 0.02em;
    }
    /* Totals */
    .totals-section {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 32px;
    }
    .totals-table {
      border-collapse: collapse;
      min-width: 300px;
    }
    .totals-table td {
      padding: 5px 10px;
      font-size: 11px;
    }
    .sub-label { color: #666; font-size: 10px; }
    .total-row {
      border-top: 2px solid #111;
      font-weight: 700;
      font-size: 13px;
    }
    .total-row td { padding-top: 8px; }
    /* Footer */
    .footer {
      border-top: 1px solid #e5e7eb;
      padding-top: 16px;
      font-size: 9px;
      color: #888;
      line-height: 1.6;
    }
    .footer strong {
      color: #555;
    }
    @media print {
      .page { padding: 20px 30px; }
    }
  </style>
</head>
<body>
  <div class="page">

    <div class="header-row">
      <div class="header-left">
        <div class="doc-title">Commercial Invoice</div>
        <div class="doc-subtitle">For Customs Purposes</div>
      </div>
      <div class="header-right">
        <table class="meta-table">
          <tr>
            <td>Invoice No.</td>
            <td>${esc(data.invoiceNumber)}</td>
          </tr>
          <tr>
            <td>Date</td>
            <td>${esc(data.invoiceDate)}</td>
          </tr>
          <tr>
            <td>Currency</td>
            <td>${esc(data.currency)}</td>
          </tr>
        </table>
      </div>
    </div>

    <div class="addresses">
      <div class="address-block">
        <h3>Shipper / Exporter</h3>
        <p>
          <strong>${esc(data.seller.name)}</strong><br>
          ${sellerAddr}
        </p>
        ${
          data.seller.email || data.seller.phone
            ? `<p class="contact">
                ${data.seller.email ? `Email: ${esc(data.seller.email)}<br>` : ""}
                ${data.seller.phone ? `Tel: ${esc(data.seller.phone)}` : ""}
               </p>`
            : ""
        }
      </div>
      <div class="address-block">
        <h3>Consignee / Buyer</h3>
        <p>
          <strong>${esc(data.buyer.name)}</strong><br>
          ${data.buyer.company ? `${esc(data.buyer.company)}<br>` : ""}
          ${buyerAddr}
        </p>
        ${data.buyer.phone ? `<p class="contact">Tel: ${esc(data.buyer.phone)}</p>` : ""}
      </div>
    </div>

    ${warningBanner}

    <table class="items-table">
      <thead>
        <tr>
          <th class="desc">Description of Goods</th>
          <th class="center">Qty</th>
          <th class="right">Unit Value</th>
          <th class="right">Line Total</th>
          <th class="center">HS Code</th>
          <th class="center">Country of Origin</th>
        </tr>
      </thead>
      <tbody>
        ${lineRows}
      </tbody>
    </table>

    <div class="totals-section">
      <table class="totals-table">
        ${shippingRow}
        <tr class="total-row">
          <td colspan="5" class="right">Total Declared Value</td>
          <td class="right">${esc(data.currency)} ${esc(data.declaredTotal)}</td>
        </tr>
      </table>
    </div>

    <div class="footer">
      <strong>Important Notice:</strong>
      This document is generated from Shopify order data and is provided for informational purposes only.
      It must be reviewed, verified, and if necessary amended by your licensed customs broker or freight forwarder
      before submission to customs authorities. CustomsReady Lite does not provide legal, tax, or customs
      clearance advice. The declared values and descriptions are sourced directly from your Shopify store
      and may require adjustment to comply with applicable import and export regulations.
    </div>

  </div>
</body>
</html>`;
}

// ─── Puppeteer browser singleton ─────────────────────────────────────────────

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.connected) {
    return _browser;
  }
  _browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  });
  return _browser;
}

// ─── PDF generation ───────────────────────────────────────────────────────────

/**
 * Generate a commercial invoice PDF from order data.
 * Returns a Buffer containing the PDF binary.
 */
export async function generateInvoicePdf(data: InvoiceData): Promise<Buffer> {
  const html = renderInvoiceHtml(data);
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
    });
    logger.info(
      { invoiceNumber: data.invoiceNumber, completeness: data.completenessStatus },
      "PDF generated successfully"
    );
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

// Exported for testing
export { renderInvoiceHtml };
