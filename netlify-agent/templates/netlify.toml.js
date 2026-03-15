/**
 * Generate a netlify.toml for a Shopify Remix v2 app inside a monorepo.
 * The [functions] block is required for Remix server-side routes on Netlify.
 */
export function generateToml({ buildCommand, publishDir, nodeVersion, repoDir }) {
  return `[build]
  base    = "${repoDir}"
  command = "${buildCommand}"
  publish = "${publishDir}"

[build.environment]
  NODE_VERSION  = "${nodeVersion}"
  NODE_OPTIONS  = "--max-old-space-size=4096"

# Remix v2 — server functions
[functions]
  directory = "build/server"

# Force all routes through Remix entry point
[[redirects]]
  from   = "/*"
  to     = "/.netlify/functions/server"
  status = 200

[dev]
  command   = "npm run dev"
  port      = 3000
  targetPort = 3000
`;
}
