# Shopify Apps Monorepo

A standardized monorepo containing six Shopify applications migrated from Vercel to Netlify, utilizing a unified pnpm workspace and a consistent Remix architecture.

## 🚀 Repository Structure

The monorepo is organized into six primary applications, each standardized with a consistent frontend layout and configuration.

| Folder | Application Name | Production URL | Entry Point |
| :--- | :--- | :--- | :--- |
| `/apps/poref-new` | **PORef** | `poref-prod.netlify.app` | `/app` |
| `/apps/quoteloop-new` | **QuoteLoop** | `quoteloop-prod.netlify.app` | `/app` |
| `/Craftline` | **Maker Queue** | `craftline-prod.netlify.app` | `/app` |
| `/customsready` | **CustomsReady Lite** | `customsready-prod.netlify.app` | `/app` |
| `/FixitCSV` | **FixitCSV** | `fixitcsv-prod.netlify.app` | `/app` |
| `/Stagewise` | **Production Queue Communicator** | `stagewise-prod.netlify.app` | `/app` |

## 🛠 Tech Stack
- **Framework**: Remix (standardized to Vite-based builds)
- **Package Manager**: pnpm (Workspaces enabled)
- **Deployment**: Netlify
- **Database**: Prisma with Neon DB (Postgres)
- **Shopify Integration**: App Bridge v4, Polaris v13

## 📦 How to Build

Install dependencies from the root:
```bash
pnpm install
```

Build all applications:
```bash
pnpm run build:all
```

Build a specific application:
```bash
pnpm --filter [package-name] run build
```

## 🏗 Standardized Architecture
All applications have been normalized to follow a consistent structural standard:
1. **Unified Root Redirects**: Accessing the base domain will automatically redirect authenticated users to the `/app` dashboard.
2. **Authenticated Layouts**: Consistent `app.tsx` routes handle the `AppProvider` and `NavMenu` initialization.
3. **Clean Root Configurations**: `root.tsx` across all apps is optimized to include only necessary scripts and global styles (Polaris).
4. **Environment-Based Configuration**: Scopes and Netlify environmental requirements are documented in the `docs/` folder.

## 📄 Documentation
Detailed documentation on the migration and verification can be found in the `docs/` and `.gemini/antigravity/brain/` directories:
- [Embedded App Verification Guide](./docs/embedded-app-verification-guide.md)
- [Netlify Environment Requirements](./docs/netlify-env-requirements.md)
- [Repository Inventory](./docs/repo-inventory.md)
- [Full Migration Walkthrough](file:///C:/Users/Admin/.gemini/antigravity/brain/59a18ba5-d224-404b-b792-3eacbaaac34e/walkthrough.md)
