/**
 * report-builder.server.js
 *
 * Assembles the results from app-scanner and liquid-scanner into a single
 * structured report object. Calculates the summary statistics and
 * estimated developer hours to resolve all flagged issues.
 *
 * Source requirement: "Generate PDF/email report: X apps confirmed compatible,
 *   Y apps compatibility unknown, Z Liquid customizations will break,
 *   W scripts may need replacement"
 * Source requirement: "Flag estimated developer hours to resolve"
 */

/**
 * Estimated hours to investigate an app with "unknown" compatibility status.
 * This represents the time a developer would spend checking the app's
 * documentation or contacting support.
 * Implementation choice due to missing source detail.
 */
const UNKNOWN_APP_INVESTIGATION_HOURS = 0.5;

/**
 * Default estimated resolve hours for an incompatible app with no DB entry
 * that provides a specific estimate.
 * Implementation choice due to missing source detail.
 */
const DEFAULT_INCOMPATIBLE_APP_HOURS = 2;

/**
 * Estimated developer hours per Liquid finding severity level.
 * These represent the time to understand, fix, and test the finding.
 * Implementation choice due to missing source detail.
 */
const LIQUID_HOURS_BY_SEVERITY = {
  high: 2,
  medium: 0.5,
};

/**
 * Builds the full audit report from app scan results and liquid scan results.
 *
 * @param {Array} appResults - Output from scanInstalledApps()
 * @param {object} liquidScanOutput - Output from scanLiquidFiles()
 * @param {string} shop - Store myshopify domain
 * @returns {AuditReport}
 *
 * AuditReport shape:
 * {
 *   shop: string,
 *   generatedAt: string (ISO),
 *   activeTheme: { id: string, name: string },
 *
 *   appResults: AppResult[],
 *   liquidResults: LiquidScanResult[],
 *
 *   summary: {
 *     totalAppsScanned: number,
 *     appsCompatible: number,
 *     appsIncompatible: number,
 *     appsPartial: number,
 *     appsUnknown: number,
 *     appsNotInDatabase: number,
 *
 *     totalLiquidFilesWithFindings: number,
 *     highSeverityLiquidFindings: number,
 *     mediumSeverityLiquidFindings: number,
 *
 *     estimatedDeveloperHours: number,
 *     riskLevel: "low" | "medium" | "high" | "critical",
 *   },
 *
 *   disclaimer: string,
 * }
 */
export function buildReport(appResults, liquidScanOutput, shop) {
  const { activeTheme, results: liquidResults } = liquidScanOutput;

  // ---------------------------------------------------------------------------
  // App summary counts
  // ---------------------------------------------------------------------------
  const appsCompatible = appResults.filter((a) => a.status === "compatible").length;
  const appsIncompatible = appResults.filter((a) => a.status === "incompatible").length;
  const appsPartial = appResults.filter((a) => a.status === "partial").length;
  const appsUnknown = appResults.filter((a) => a.status === "unknown").length;
  const appsNotInDatabase = appResults.filter((a) => !a.inDatabase).length;

  // ---------------------------------------------------------------------------
  // Liquid finding counts
  // ---------------------------------------------------------------------------
  let highSeverityLiquidFindings = 0;
  let mediumSeverityLiquidFindings = 0;

  for (const fileResult of liquidResults) {
    for (const finding of fileResult.findings) {
      if (finding.severity === "high") highSeverityLiquidFindings++;
      else if (finding.severity === "medium") mediumSeverityLiquidFindings++;
    }
  }

  // ---------------------------------------------------------------------------
  // Estimated developer hours
  // ---------------------------------------------------------------------------
  let estimatedHours = 0;

  // App resolution hours
  for (const app of appResults) {
    if (app.status === "incompatible") {
      estimatedHours += app.estimatedResolveHours ?? DEFAULT_INCOMPATIBLE_APP_HOURS;
    } else if (app.status === "partial") {
      estimatedHours += app.estimatedResolveHours ?? 1;
    } else if (app.status === "unknown") {
      // Each unknown app requires investigation time even if it turns out to be fine
      estimatedHours += UNKNOWN_APP_INVESTIGATION_HOURS;
    }
  }

  // Liquid finding resolution hours
  estimatedHours += highSeverityLiquidFindings * LIQUID_HOURS_BY_SEVERITY.high;
  estimatedHours += mediumSeverityLiquidFindings * LIQUID_HOURS_BY_SEVERITY.medium;

  // Round to nearest 0.5
  estimatedHours = Math.round(estimatedHours * 2) / 2;

  // ---------------------------------------------------------------------------
  // Risk level
  // ---------------------------------------------------------------------------
  const riskLevel = calculateRiskLevel(
    appsIncompatible,
    appsPartial,
    appsUnknown,
    highSeverityLiquidFindings
  );

  // ---------------------------------------------------------------------------
  // Disclaimer
  // Source requirement: "Report must include clear disclaimer language about unknown-status apps"
  // Source requirement: "False confidence risk is significant — must scope language carefully"
  // ---------------------------------------------------------------------------
  const disclaimer = [
    "IMPORTANT: This report is generated by automated pattern matching and database lookup.",
    `${appsNotInDatabase} of ${appResults.length} installed apps were not found in the compatibility database and are marked "unknown."`,
    "An "all clear" result for apps means only that no patterns were detected AND that the apps found in the database are currently listed as compatible.",
    "It does not guarantee that your store will be unaffected by the New Customer Accounts migration.",
    "Before switching, always: (1) test the migration in a development store, (2) verify compatibility with app vendors directly, and (3) review Shopify's official New Customer Accounts documentation.",
    "The compatibility database requires ongoing manual curation and may not reflect the latest app updates.",
  ].join(" ");

  return {
    shop,
    generatedAt: new Date().toISOString(),
    activeTheme,
    appResults,
    liquidResults,
    summary: {
      totalAppsScanned: appResults.length,
      appsCompatible,
      appsIncompatible,
      appsPartial,
      appsUnknown,
      appsNotInDatabase,
      totalLiquidFilesWithFindings: liquidResults.length,
      highSeverityLiquidFindings,
      mediumSeverityLiquidFindings,
      estimatedDeveloperHours: estimatedHours,
      riskLevel,
    },
    disclaimer,
  };
}

/**
 * Calculates an overall risk level for the migration based on findings.
 *
 * critical: 1+ incompatible apps OR 3+ high-severity Liquid findings
 * high:     1+ partial apps OR 1–2 high-severity Liquid findings
 * medium:   1+ unknown apps (not in DB) OR medium-severity Liquid findings only
 * low:      all apps compatible and no Liquid findings
 */
function calculateRiskLevel(
  appsIncompatible,
  appsPartial,
  appsUnknown,
  highSeverityLiquidFindings
) {
  if (appsIncompatible > 0 || highSeverityLiquidFindings >= 3) return "critical";
  if (appsPartial > 0 || highSeverityLiquidFindings >= 1) return "high";
  if (appsUnknown > 0) return "medium";
  return "low";
}
