/**
 * app-scanner.server.js
 *
 * Fetches all apps installed on the store via the Shopify GraphQL Admin API
 * (appInstallations query, requires read_apps scope), then cross-references
 * each installed app against the maintained compatibility database.
 *
 * Source requirement: "Scan installed app list via Admin API"
 * Source requirement: "Cross-reference against a maintained database of app compatibility status"
 */

const INSTALLED_APPS_QUERY = `
  query InstalledApps($cursor: String) {
    appInstallations(first: 50, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        id
        launchUrl
        app {
          id
          title
          handle
          developerName
          appStoreUrl
        }
      }
    }
  }
`;

/**
 * Fetches all installed apps from Shopify Admin GraphQL API, paginating through
 * all pages. Returns a flat array of app objects.
 *
 * @param {object} admin - The authenticated Shopify admin GraphQL client
 * @returns {Promise<Array<{id: string, title: string, handle: string, developerName: string, appStoreUrl: string}>>}
 */
async function fetchAllInstalledApps(admin) {
  const apps = [];
  let cursor = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(INSTALLED_APPS_QUERY, {
      variables: { cursor },
    });
    const data = await response.json();

    if (data.errors) {
      throw new Error(
        `GraphQL error fetching installed apps: ${JSON.stringify(data.errors)}`
      );
    }

    const { nodes, pageInfo } = data.data.appInstallations;

    for (const node of nodes) {
      apps.push({
        id: node.app.id,
        title: node.app.title,
        handle: node.app.handle ?? "",
        developerName: node.app.developerName ?? null,
        appStoreUrl: node.app.appStoreUrl ?? null,
      });
    }

    hasNextPage = pageInfo.hasNextPage;
    cursor = pageInfo.endCursor;
  }

  return apps;
}

/**
 * Looks up a single installed app in the compatibility database using a
 * multi-strategy matching approach:
 *  1. Exact handle match
 *  2. Alternate handle list match
 *  3. Case-insensitive name match
 *  4. Substring name match (handles cases like "Smile: Loyalty & Rewards" vs "Smile")
 *
 * @param {{title: string, handle: string}} app
 * @param {object} db - Parsed compatibility database JSON
 * @returns {object|null} Database entry or null if not found
 */
function lookupInCompatibilityDb(app, db) {
  const appHandleLower = app.handle?.toLowerCase() ?? "";
  const appTitleLower = app.title?.toLowerCase() ?? "";

  // 1. Exact handle match
  let match = db.apps.find(
    (entry) => entry.handle.toLowerCase() === appHandleLower
  );
  if (match) return match;

  // 2. Alternate handle match
  match = db.apps.find((entry) =>
    entry.alternateHandles?.some(
      (alt) => alt.toLowerCase() === appHandleLower
    )
  );
  if (match) return match;

  // 3. Case-insensitive name exact match
  match = db.apps.find(
    (entry) => entry.name.toLowerCase() === appTitleLower
  );
  if (match) return match;

  // 4. Substring match — only when strings are non-empty to avoid false positives
  if (appTitleLower.length > 0) {
    match = db.apps.find((entry) => {
      const dbNameLower = entry.name.toLowerCase();
      return (
        appTitleLower.includes(dbNameLower) ||
        dbNameLower.includes(appTitleLower)
      );
    });
    if (match) return match;
  }

  return null;
}

/**
 * Scans all installed apps on the store and returns a compatibility result
 * for each one. Apps not found in the database are returned with status "unknown".
 *
 * @param {object} admin - Authenticated Shopify admin client
 * @param {object} compatibilityDb - Parsed compatibility database JSON object
 * @returns {Promise<Array<AppResult>>}
 *
 * AppResult shape:
 * {
 *   appHandle: string,
 *   appName: string,
 *   developerName: string|null,
 *   appStoreUrl: string|null,
 *   status: "compatible" | "incompatible" | "partial" | "unknown",
 *   summary: string|null,
 *   notes: string|null,
 *   sourceUrl: string|null,
 *   estimatedResolveHours: number|null,
 *   inDatabase: boolean,
 * }
 */
export async function scanInstalledApps(admin, compatibilityDb) {
  const installedApps = await fetchAllInstalledApps(admin);

  return installedApps.map((app) => {
    const dbEntry = lookupInCompatibilityDb(app, compatibilityDb);

    return {
      appHandle: app.handle,
      appName: app.title,
      developerName: app.developerName,
      appStoreUrl: app.appStoreUrl,
      status: dbEntry?.status ?? "unknown",
      summary: dbEntry?.summary ?? null,
      notes: dbEntry?.notes ?? null,
      sourceUrl: dbEntry?.sourceUrl ?? null,
      estimatedResolveHours: dbEntry?.estimatedResolveHours ?? null,
      inDatabase: !!dbEntry,
    };
  });
}
