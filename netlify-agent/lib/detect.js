import { getFile, getPackageJson } from "./github.js";

/**
 * Inspect an app's directory and return Netlify build settings.
 * All Shopify Remix v2 apps share the same pattern — but we verify.
 */
export async function detectBuildConfig(repoDir) {
  const pkg = await getPackageJson(repoDir);

  // Check for explicit netlify.toml already present
  const existingToml = await getFile(`${repoDir}/netlify.toml`);
  if (existingToml) {
    console.log(`  Detect: existing netlify.toml found in ${repoDir}`);
    // Still return defaults — we will not overwrite existing toml
    return { hasToml: true };
  }

  // Detect framework from dependencies
  const deps = {
    ...pkg?.dependencies ?? {},
    ...pkg?.devDependencies ?? {},
  };

  let buildCommand   = "npm run build";
  let publishDir     = "build/client";   // Remix v2 default
  let nodeVersion    = "20";
  let framework      = "remix";

  if (deps["@remix-run/react"] || deps["@remix-run/node"]) {
    framework    = "remix";
    buildCommand = "npm run build";
    publishDir   = "build/client";
  } else if (deps["next"]) {
    framework    = "next";
    buildCommand = "npm run build";
    publishDir   = ".next";
  } else if (deps["vite"]) {
    framework    = "vite";
    buildCommand = "npm run build";
    publishDir   = "dist";
  } else if (deps["react-scripts"]) {
    framework    = "cra";
    buildCommand = "npm run build";
    publishDir   = "build";
  }

  // Detect node version from .nvmrc or .node-version
  for (const nvmFile of [".nvmrc", ".node-version"]) {
    const f = await getFile(`${repoDir}/${nvmFile}`);
    if (f) {
      nodeVersion = f.content.trim().replace(/^v/, "");
      break;
    }
  }

  // Check engines field in package.json
  if (pkg?.engines?.node) {
    nodeVersion = pkg.engines.node.replace(/[^0-9.]/g, "").split(".")[0];
  }

  return { hasToml: false, framework, buildCommand, publishDir, nodeVersion };
}
