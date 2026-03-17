# Repository Inventory

## 1. Top-Level Directory Structure
- `apps/` (contains poref-new, quoteloop-new)
- `apps-launch/`
- `Craftline/`
- `FixitCSV/`
- `Stagewise/`
- `chargeback/`
- `customsready/`
- `docs/`
- `netlify-agent/`
- `reports/`

## 2. Six Shopify Apps
1. `Craftline` (in `/Craftline`, name: `maker-queue`)
2. `FixitCSV` (in `/FixitCSV`, name: `fixitcsv`)
3. `Stagewise` (in `/Stagewise`, name: `production-queue-communicator`)
4. `customsready` (in `/customsready`, name: `customsready-lite`)
5. `poref-new` (in `/apps/poref-new`, name: `app` -> renamed to `poref-new`)
6. `quoteloop-new` (in `/apps/quoteloop-new`, name: `app` -> renamed to `quoteloop-new`)

## 3. Build System Files
- `package.json` (Root, netlify-agent, and in each of the 6 apps)
- `pnpm-workspace.yaml` (Root)
- `pnpm-lock.yaml` (Root)

## 4. Deployment Config Files
- Vercel: None found.
- Netlify: `netlify.toml` in all 6 apps.

## 5. CI/CD Workflow Files
- None. `.github` directory does not exist.

## 6. Environment Files
- `.env.example` at root.

## 7. Frontend Framework Indicators
- `vite.config.ts` inside all 6 apps indicating Remix + Vite.

## 8. Shopify-specific Files
- `shopify.app.toml` inside each of the 6 apps.

## 10. Redundancies and Known Issues
- **Duplicate Package Names**: Both `poref-new` and `quoteloop-new` were named `app`.
- **Inconsistent Build Commands**: `netlify.toml` files currently use `npm install && npm run build` instead of `pnpm`.
- **Stagewise Build failure**: `Stagewise` build is failing with `remix vite:build`, likely due to dependency or Vite config issues.
- **Vercel Artifacts**: Most already removed, but remnants might exist in `package.json` scripts if any.

