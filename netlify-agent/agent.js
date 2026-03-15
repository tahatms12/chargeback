import "dotenv/config";
import { APPS } from "./config/apps.js";
import { getRepoMeta, upsertFile } from "./lib/github.js";
import { detectBuildConfig } from "./lib/detect.js";
import { generateToml } from "./templates/netlify.toml.js";
import {
  getSiteByName, createSite, updateSite,
  triggerDeploy, waitForDeploy,
  addCustomDomain, provisionSsl, waitForSsl,
} from "./lib/netlify.js";
import { upsertCNAME } from "./lib/dns.js";

const ROOT_DOMAIN = process.env.ROOT_DOMAIN;

async function processApp(app, repoMeta) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`APP: ${app.name}  |  ${app.subdomain}.${ROOT_DOMAIN}`);
  console.log("=".repeat(60));

  // ── Phase 1: Detect build config ─────────────────────────────
  const config = await detectBuildConfig(app.repoDir);
  console.log(`  Framework: ${config.framework ?? "existing toml"}`);

  if (!config.hasToml) {
    // ── Phase 2a: Write netlify.toml into the repo ──────────────
    const toml = generateToml({
      buildCommand: config.buildCommand,
      publishDir:   config.publishDir,
      nodeVersion:  config.nodeVersion,
      repoDir:      app.repoDir,
    });
    await upsertFile(
      `${app.repoDir}/netlify.toml`,
      toml,
      `chore(${app.name}): add Netlify build config`
    );
  }

  // ── Phase 2b: Create or retrieve Netlify site ─────────────────
  let site = await getSiteByName(app.netlifyName);

  if (!site) {
    console.log(`  Netlify: creating site ${app.netlifyName}`);
    site = await createSite({
      name:         app.netlifyName,
      repoId:       repoMeta.id,
      repoFullName: repoMeta.fullName,
      branch:       repoMeta.defaultBranch,
      // If toml exists, we clear these to let toml take over. 
      // Base directory MUST still be set for monorepos.
      buildCommand: config.hasToml ? null : (config.buildCommand ?? "npm run build"),
      publishDir:   config.hasToml ? null : (config.publishDir   ?? "build/client"),
      repoDir:      app.repoDir,
      nodeVersion:  config.nodeVersion  ?? "20",
    });
  } else {
    console.log(`  Netlify: site exists → ${site.id}`);
    // Always sync settings to ensure base directory and cleared overrides are applied
    await updateSite(site.id, {
      buildCommand: config.hasToml ? null : (config.buildCommand ?? "npm run build"),
      publishDir:   config.hasToml ? null : (config.publishDir   ?? "build/client"),
      repoDir:      app.repoDir,
      nodeVersion:  config.nodeVersion  ?? "20",
    });
  }

  const netlifyDomain = `${site.subdomain ?? app.netlifyName}.netlify.app`;

  // ── Phase 3: Deploy ───────────────────────────────────────────
  await triggerDeploy(site.id);
  let deploy;
  try {
    deploy = await waitForDeploy(site.id);
    console.log(`  Deploy: SUCCESS → https://${netlifyDomain}`);
  } catch (buildErr) {
    console.error(`  Deploy FAILED: ${buildErr.message}`);
    console.error("  Investigate build logs and fix netlify.toml, then re-run agent.");
    return { app: app.name, status: "build_failed", error: buildErr.message };
  }

  // ── Phase 4: Attach custom domain ────────────────────────────
  const customDomain = `${app.subdomain}.${ROOT_DOMAIN}`;
  await addCustomDomain(site.id, customDomain);

  // ── Phase 4b: Set DNS record in Cloudflare ───────────────────
  if (process.env.CLOUDFLARE_TOKEN && process.env.CLOUDFLARE_TOKEN !== 'skip') {
    await upsertCNAME(app.subdomain, ROOT_DOMAIN, netlifyDomain);
  } else {
    console.log(`  CF: skipping DNS sync (no token provided)`);
  }

  // ── Phase 4c: Provision TLS ───────────────────────────────────
  await provisionSsl(site.id);
  await waitForSsl(site.id);

  // ── Phase 5: Summary ─────────────────────────────────────────
  return {
    app:           app.name,
    status:        "deployed",
    netlifyUrl:    `https://${netlifyDomain}`,
    customDomain:  `https://${customDomain}`,
    dnsRecord: {
      type:  "CNAME",
      host:  app.subdomain,
      value: netlifyDomain,
    },
    buildConfig: {
      command:   config.buildCommand ?? "npm run build",
      publishDir: config.publishDir  ?? "build/client",
      nodeVersion: config.nodeVersion ?? "20",
    },
  };
}

// ── Entry point ─────────────────────────────────────────────────
(async () => {
  console.log("Netlify deployment agent starting...\n");

  const repoMeta = await getRepoMeta();
  console.log(`Repo: ${repoMeta.fullName} | branch: ${repoMeta.defaultBranch} | id: ${repoMeta.id}`);

  const results = [];

  for (const app of APPS) {
    try {
      const result = await processApp(app, repoMeta);
      results.push(result);
    } catch (err) {
      console.error(`\nFATAL for ${app.name}: ${err.message}`);
      results.push({ app: app.name, status: "error", error: err.message });
    }
  }

  // ── Final deployment report ──────────────────────────────────
  console.log("\n\n" + "=".repeat(60));
  console.log("DEPLOYMENT REPORT");
  console.log("=".repeat(60));

  for (const r of results) {
    if (r.status === "deployed") {
      console.log(`\n✓ ${r.app}`);
      console.log(`  Netlify URL  : ${r.netlifyUrl}`);
      console.log(`  Custom domain: ${r.customDomain}`);
      console.log(`  DNS CNAME    : ${r.dnsRecord.host} → ${r.dnsRecord.value}`);
      console.log(`  Build cmd    : ${r.buildConfig.command}`);
      console.log(`  Publish dir  : ${r.buildConfig.publishDir}`);
      console.log(`  Node version : ${r.buildConfig.nodeVersion}`);
    } else {
      console.log(`\n✗ ${r.app} — ${r.status}: ${r.error}`);
    }
  }
})();
