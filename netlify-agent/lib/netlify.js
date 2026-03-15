const BASE = "https://api.netlify.com/api/v1";

function headers() {
  return {
    Authorization: `Bearer ${process.env.NETLIFY_TOKEN}`,
    "Content-Type": "application/json",
  };
}

/**
 * List all sites. Used to check if a site already exists.
 */
export async function listSites() {
  const res = await fetch(`${BASE}/sites`, { headers: headers() });
  if (!res.ok) throw new Error(`Netlify listSites: ${res.status}`);
  return res.json();
}

/**
 * Create a site and link it to a GitHub repo.
 * repoId      — numeric GitHub repo ID
 * repoFullName — "owner/repo"
 * branch      — default branch
 */
export async function createSite({ name, repoId, repoFullName, branch, buildCommand, publishDir, repoDir, nodeVersion }) {
  const body = {
    name,
    repo: {
      provider:        "github",
      id:              repoId,
      repo:            repoFullName,
      branch,
      cmd:             buildCommand || "",
      dir:             publishDir   || "",
      base:            repoDir,       // monorepo root for this app
      allowed_branches: [branch],
    },
    build_settings: {
      cmd:              buildCommand || "",
      dir:              publishDir   || "",
      base:             repoDir,
      env: {
        NODE_VERSION: nodeVersion,
      },
    },
  };

  const res = await fetch(`${BASE}/sites`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
  });
  const dataText = await res.text();
  let data;
  try {
    data = JSON.parse(dataText);
  } catch (err) {
    throw new Error(`Netlify createSite (non-JSON): ${dataText}`);
  }
  if (!res.ok) throw new Error(`Netlify createSite: ${JSON.stringify(data)}`);
  console.log(`  Netlify: site created → ${data.id} (${data.subdomain}.netlify.app)`);
  return data;
}

/**
 * Get an existing site by its custom name (slug).
 * Returns null if not found.
 */
export async function getSiteByName(name) {
  const sites = await listSites();
  return sites.find((s) => s.name === name) ?? null;
}

/**
 * Update build settings on an existing site.
 */
export async function updateSite(siteId, { buildCommand, publishDir, repoDir, nodeVersion }) {
  const body = {
    build_settings: {
      cmd:  buildCommand || "",
      dir:  publishDir   || "",
      base: repoDir,
    },
  };
  const res = await fetch(`${BASE}/sites/${siteId}`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    let err;
    try {
      err = JSON.parse(errText);
    } catch (e) {
      throw new Error(`Netlify updateSite (non-JSON): ${errText}`);
    }
    throw new Error(`Netlify updateSite: ${JSON.stringify(err)}`);
  }
  console.log(`  Netlify: site ${siteId} updated`);
}

/**
 * Trigger a new deploy (build) for a site.
 */
export async function triggerDeploy(siteId) {
  const res = await fetch(`${BASE}/sites/${siteId}/builds`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ clear_cache: true }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Netlify triggerDeploy: ${JSON.stringify(data)}`);
  console.log(`  Netlify: deploy triggered → build ${data.id}`);
  return data;
}

/**
 * Poll deploy status until done or failed.
 * Returns final deploy object.
 */
export async function waitForDeploy(siteId, timeoutMs = 600_000) {
  const interval = 15_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const res = await fetch(`${BASE}/sites/${siteId}/deploys?per_page=1`, {
      headers: headers(),
    });
    const [deploy] = await res.json();
    console.log(`  Netlify: deploy state = ${deploy.state}`);

    if (deploy.state === "ready")  return deploy;
    if (deploy.state === "error") {
      // Fetch build log for diagnosis
      const logRes = await fetch(`${BASE}/deploys/${deploy.id}`, { headers: headers() });
      const logData = await logRes.json();
      throw new Error(`Build failed.\nLog: ${logData.error_message ?? "(see Netlify dashboard)"}`);
    }

    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("Deploy timed out after 10 minutes");
}

/**
 * Add a custom domain to a site.
 */
export async function addCustomDomain(siteId, domain) {
  const res = await fetch(`${BASE}/sites/${siteId}/domain_aliases`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ domain }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Netlify addCustomDomain: ${JSON.stringify(data)}`);
  console.log(`  Netlify: custom domain added → ${domain}`);
  return data;
}

/**
 * Check HTTPS provisioning status for a domain.
 */
export async function getSslStatus(siteId) {
  const res = await fetch(`${BASE}/sites/${siteId}/ssl`, { headers: headers() });
  if (!res.ok) return null;
  return res.json();
}

/**
 * Provision/renew SSL for a site.
 */
export async function provisionSsl(siteId) {
  const res = await fetch(`${BASE}/sites/${siteId}/ssl`, {
    method: "POST",
    headers: headers(),
  });
  if (!res.ok) {
    const err = await res.json();
    console.warn(`  Netlify: SSL provision warning: ${JSON.stringify(err)}`);
  } else {
    console.log(`  Netlify: SSL provisioning triggered`);
  }
}

/**
 * Poll until SSL certificate is issued.
 */
export async function waitForSsl(siteId, timeoutMs = 300_000) {
  const interval = 20_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const ssl = await getSslStatus(siteId);
    if (ssl?.state === "issued") {
      console.log(`  Netlify: SSL issued`);
      return true;
    }
    console.log(`  Netlify: SSL state = ${ssl?.state ?? "unknown"} — waiting`);
    await new Promise((r) => setTimeout(r, interval));
  }
  console.warn(`  Netlify: SSL not issued within timeout — may still propagate`);
  return false;
}
