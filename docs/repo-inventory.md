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
1. `Craftline` (in /Craftline)
2. `FixitCSV` (in /FixitCSV)
3. `Stagewise` (in /Stagewise)
4. `customsready` (in /customsready)
5. `poref-new` (in /apps/poref-new)
6. `quoteloop-new` (in /apps/quoteloop-new)

## 3. Build System Files
- `package.json` (Root, netlify-agent, and in each of the 6 apps)
- `package-lock.json` (Root, netlify-agent)
- `pnpm-lock.yaml` (`apps/poref-new`, `apps/quoteloop-new`)

## 4. Deployment Config Files
- Vercel: None found (`vercel.json` previously deleted, no `.vercel` directories).
- Netlify: None found currently.
- Render/Fly/Other: None.

## 5. CI/CD Workflow Files
- None. `.github` directory does not exist.

## 6. Environment Files
- `.env.example` at root.
- No other `.env` files found in version control.

## 7. Frontend Framework Indicators
- `vite.config.ts` inside all 6 apps indicating Remix + Vite.

## 8. Shopify-specific Files
- `shopify.app.toml` inside each of the 6 apps.
- `extensions/` directories exist in some apps (e.g., customsready).

## 9. App-Specific Details
For all 6 apps:
- **Framework**: Remix (via Vite)
- **Build Command**: `remix vite:build` 
- **Output Directory**: `build/`
- **Port/Dev Server**: Managed by Shopify CLI (`shopify app dev`)
- **Existing Environment Variables**: `SHOPIFY_API_KEY`, `SHOPIFY_APP_URL`
- **Shopify API Key References**: Present in `shopify.app.toml` as `client_id`
- **App Bridge Integration**: `@shopify/app-bridge-react` is present as per prior logs.

## 10. Redundancies to Address
- **Multiple package managers**: `package-lock.json` (npm) and `pnpm-lock.yaml` (pnpm) are both in use. Standardizing to pnpm workspaces.
- **Build configs**: `vite.config.ts` might have duplicated logic.
- **Unused scripts/Vercel artifacts**: Root `package.json` relies on `npm --prefix` instead of proper workspace commands. Vercel artifacts are already cleared based on current state.
