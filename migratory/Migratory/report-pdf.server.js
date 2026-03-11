/**
 * report-pdf.server.js
 *
 * Generates a downloadable PDF audit report from a structured AuditReport object.
 * Uses PDFKit to build the PDF in memory and returns the buffer.
 *
 * Source requirement: "Generate PDF/email report"
 * Source requirement: report includes "X apps confirmed compatible, Y apps compatibility unknown,
 *   Z Liquid customizations will break, W scripts may need replacement"
 * Source requirement: "Flag estimated developer hours to resolve"
 * Source requirement: disclaimer language about unknown-status apps
 */

import PDFDocument from "pdfkit";

// Colors used throughout the PDF
const COLORS = {
  primary: "#1A1A2E",
  compatible: "#2E7D32",
  incompatible: "#C62828",
  partial: "#E65100",
  unknown: "#455A64",
  high: "#C62828",
  medium: "#E65100",
  low: "#2E7D32",
  critical: "#880E4F",
  lightGray: "#F5F5F5",
  borderGray: "#E0E0E0",
  textDark: "#212121",
  textMedium: "#616161",
  white: "#FFFFFF",
};

const STATUS_LABELS = {
  compatible: "Compatible",
  incompatible: "Incompatible",
  partial: "Partial — Action Required",
  unknown: "Unknown — Verify Required",
};

const RISK_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

/**
 * Generates a PDF audit report and returns a Buffer.
 *
 * @param {object} report - The AuditReport from report-builder.server.js
 * @returns {Promise<Buffer>}
 */
export function generatePdfReport(report) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    renderReport(doc, report);
    doc.end();
  });
}

function renderReport(doc, report) {
  const { summary, appResults, liquidResults, disclaimer, shop, generatedAt, activeTheme } = report;

  // ---------------------------------------------------------------------------
  // Cover / Header
  // ---------------------------------------------------------------------------
  doc
    .fontSize(22)
    .fillColor(COLORS.primary)
    .font("Helvetica-Bold")
    .text("New Customer Accounts", { align: "left" })
    .text("Migration Audit Report", { align: "left" });

  doc.moveDown(0.3);

  doc
    .fontSize(10)
    .fillColor(COLORS.textMedium)
    .font("Helvetica")
    .text(`Store: ${shop}`)
    .text(`Active Theme: ${activeTheme?.name ?? "Unknown"}`)
    .text(`Generated: ${new Date(generatedAt).toLocaleString("en-US", { timeZone: "UTC" })} UTC`);

  doc.moveDown(1);
  horizontalRule(doc);
  doc.moveDown(0.8);

  // ---------------------------------------------------------------------------
  // Executive Summary
  // ---------------------------------------------------------------------------
  sectionHeader(doc, "Executive Summary");
  doc.moveDown(0.4);

  const riskColor = {
    low: COLORS.low,
    medium: COLORS.partial,
    high: COLORS.high,
    critical: COLORS.critical,
  }[summary.riskLevel] ?? COLORS.textDark;

  doc
    .fontSize(11)
    .fillColor(COLORS.textDark)
    .font("Helvetica")
    .text("Overall Migration Risk: ", { continued: true })
    .font("Helvetica-Bold")
    .fillColor(riskColor)
    .text(RISK_LABELS[summary.riskLevel] ?? summary.riskLevel);

  doc.moveDown(0.5);
  doc.font("Helvetica").fillColor(COLORS.textDark).fontSize(10);

  const summaryLines = [
    `Total apps scanned:          ${summary.totalAppsScanned}`,
    `  ✓ Compatible:              ${summary.appsCompatible}`,
    `  ✗ Incompatible:            ${summary.appsIncompatible}`,
    `  ⚠ Partial (action needed): ${summary.appsPartial}`,
    `  ? Unknown (verify needed): ${summary.appsUnknown}`,
    `  Not in database:           ${summary.appsNotInDatabase}`,
    ``,
    `Liquid files with findings:  ${summary.totalLiquidFilesWithFindings}`,
    `  High severity findings:    ${summary.highSeverityLiquidFindings}`,
    `  Medium severity findings:  ${summary.mediumSeverityLiquidFindings}`,
    ``,
    `Estimated developer hours to resolve: ${summary.estimatedDeveloperHours}h`,
  ];

  for (const line of summaryLines) {
    doc.text(line);
  }

  doc.moveDown(1);

  // ---------------------------------------------------------------------------
  // App Compatibility Results
  // ---------------------------------------------------------------------------
  sectionHeader(doc, "App Compatibility Results");
  doc.moveDown(0.4);

  if (appResults.length === 0) {
    doc.fontSize(10).fillColor(COLORS.textMedium).text("No apps found on this store.");
  } else {
    const appsByStatus = {
      incompatible: appResults.filter((a) => a.status === "incompatible"),
      partial: appResults.filter((a) => a.status === "partial"),
      unknown: appResults.filter((a) => a.status === "unknown"),
      compatible: appResults.filter((a) => a.status === "compatible"),
    };

    for (const [status, apps] of Object.entries(appsByStatus)) {
      if (apps.length === 0) continue;

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(statusColor(status))
        .text(`${STATUS_LABELS[status]} (${apps.length})`);
      doc.moveDown(0.2);

      for (const app of apps) {
        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(COLORS.textDark)
          .text(`  • ${app.appName}`, { continued: app.developerName ? true : false });

        if (app.developerName) {
          doc.font("Helvetica").fillColor(COLORS.textMedium).text(` — ${app.developerName}`);
        } else {
          doc.text("");
        }

        if (app.notes && status !== "compatible") {
          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor(COLORS.textMedium)
            .text(`    ${app.notes}`, { indent: 10 });
        }

        if (app.estimatedResolveHours != null && status !== "compatible") {
          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor(COLORS.textMedium)
            .text(`    Estimated resolution: ${app.estimatedResolveHours}h`, { indent: 10 });
        }
      }

      doc.moveDown(0.5);
    }
  }

  doc.moveDown(0.5);

  // ---------------------------------------------------------------------------
  // Liquid Theme Findings
  // ---------------------------------------------------------------------------
  sectionHeader(doc, "Liquid Theme Findings");
  doc.moveDown(0.4);

  if (liquidResults.length === 0) {
    doc
      .fontSize(10)
      .fillColor(COLORS.compatible)
      .text("No classic account Liquid patterns detected in active theme.");
  } else {
    for (const fileResult of liquidResults) {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(COLORS.textDark)
        .text(`File: ${fileResult.file}`);
      doc.moveDown(0.2);

      for (const finding of fileResult.findings) {
        const sColor = finding.severity === "high" ? COLORS.high : COLORS.partial;

        doc
          .font("Helvetica-Bold")
          .fontSize(9)
          .fillColor(sColor)
          .text(`  [${finding.severity.toUpperCase()}] ${finding.label} (${finding.matchCount} occurrence${finding.matchCount !== 1 ? "s" : ""})`);

        doc
          .font("Helvetica")
          .fontSize(8)
          .fillColor(COLORS.textMedium)
          .text(`  ${finding.description}`, { indent: 10 });

        if (finding.snippet) {
          doc
            .font("Courier")
            .fontSize(7)
            .fillColor(COLORS.textMedium)
            .text(`  ${finding.snippet}`, { indent: 10 });
        }
        doc.moveDown(0.3);
      }

      doc.moveDown(0.3);
    }
  }

  doc.moveDown(0.5);

  // ---------------------------------------------------------------------------
  // Disclaimer
  // Source requirement: "Report must include clear disclaimer language about unknown-status apps"
  // ---------------------------------------------------------------------------
  horizontalRule(doc);
  doc.moveDown(0.5);

  doc
    .fontSize(8)
    .font("Helvetica-Bold")
    .fillColor(COLORS.textDark)
    .text("DISCLAIMER");

  doc.moveDown(0.2);

  doc
    .fontSize(8)
    .font("Helvetica")
    .fillColor(COLORS.textMedium)
    .text(disclaimer, { lineGap: 2 });
}

// ---------------------------------------------------------------------------
// Layout helpers
// ---------------------------------------------------------------------------

function sectionHeader(doc, text) {
  doc
    .fontSize(13)
    .font("Helvetica-Bold")
    .fillColor(COLORS.primary)
    .text(text);
  doc.moveDown(0.1);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor(COLORS.borderGray)
    .lineWidth(0.5)
    .stroke();
}

function horizontalRule(doc) {
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor(COLORS.borderGray)
    .lineWidth(1)
    .stroke();
}

function statusColor(status) {
  switch (status) {
    case "compatible": return COLORS.compatible;
    case "incompatible": return COLORS.incompatible;
    case "partial": return COLORS.partial;
    case "unknown": return COLORS.unknown;
    default: return COLORS.textDark;
  }
}
