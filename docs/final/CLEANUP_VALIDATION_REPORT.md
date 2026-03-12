# Repo Bloat Cleanup & Validation Report

## Executive Summary
A comprehensive audit and cleanup of the repository was completed to remove dead code, unused dependencies, and obsolete structures. Care was taken to preserve all 6 functional, deployable Shopify applications. The repository now accurately reflects only active systems.

---

## Deletion Ledger

The following items were identified as bloated or obsolete and were **PERMANENTLY DELETED**:

| Target | Reason for Deletion |
|--------|---------------------|
| `app/`, `fastapi/`, `gateway/`, `mnt/`, `scripts/` | Remnants of the retired non-Shopify "ChargeGuard" Python API. The active apps run strictly on Remix/Node. |
| `main.py`, `auth.py`, `billing.py`, `config.py`, `conftest.py`, `jwt.py`, `migrate_encrypt_tokens.py`, `pytest_asyncio.py`, `rate_limit.py`, `redis_session.py`, `token_crypto.py`, `test_launch_readiness.py`, `add_compliance_jobs.sql` | Legacy Python root files belonging to the retired ChargeGuard gateway structure. |
| `docker-compose.yml` | Tied purely to the old Python API + Next.js frontend architecture. Shopify CLI apps deploy independently via Vercel/Fly and do not use this compose file. |
| `_retired/` | Hand-moved legacy Next.js web app (`frontend/`) and empty `migratory/` schema. Proven completely disconnected from active applications. |
| `poref/`, `QuoteLoop/` | Legacy source directories for apps that were successfully rebuilt and ported into `apps/poref-new` and `apps/quoteloop-new` during Phase 5. They were identical abandonware. |
| `artifacts/` | Old screenshots and unmaintained temp files predating the current AI run. |
| `LAUNCH_VERDICT.md`, `DEPLOYMENT_ARCHITECTURE.md`, `APP_STORE_SUBMISSION_STATUS.md`, `SHOPIFY_PRODUCTION_MAPPING.md` | Legacy markdown files documenting the old Python infrastructure which no longer exists. Accurate, updated documents live strictly in `docs/`. |

---

## Preservation Ledger

The following items were suspicious but **PROVABLY REQUIRED** and therefore **KEPT**:

| Target | Justification |
|--------|---------------|
| `vercel.json` (Root level) | Contains the root `framework: null` directive which prevents Vercel from incorrectly assuming the entire monorepo is a single Next.js project. It maps base traffic to `index.html`. |
| `index.html` (Root level) | The dummy target file required by the root `vercel.json` configuration to satisfy Vercel deployment requirements for the monolithic sub-directory structure. |
| `docs/` | Contains the modern audit maps, execution plans, runbooks, and checklists generated during the Phase 0-9 Shopify recovery. |
| `Craftline/`, `FixitCSV/`, `Stagewise/`, `customsready/` | Active, tested, in-place repaired Shopify Remix monorepo segments. |
| `apps/poref-new/`, `apps/quoteloop-new/` | Rebuilt, modern standard Shopify CLI templates mapping over the legacy logic of their namesakes. |

---

## Validation Process

After deletion was complete, the following validations were run against the entire `allApps` array (`Craftline`, `FixitCSV`, `Stagewise`, `customsready`, `apps/poref-new`, `apps/quoteloop-new`):

1. **Dependency Integrity:** Executed `pnpm install` in all directories. **Status: PASS.** Trees resolved completely.
2. **Schema Integrity:** Executed `pnpm exec prisma generate` in all apps. **Status: PASS.** Prisma v6 schemas successfully compiled to the Client.
3. **Build Integrity:** Executed `pnpm run build` in all apps. **Status: PASS.** Remix payloads and vite build steps completed with zero fatal errors or missing module links.
4. **Dependency Pruning:** A strict `depcheck` scan was executed against all subprojects. Results confirmed that the base Shopify CLI structures successfully self-manage tree-shaking; no blatant "dead" packages were idling beyond what Shopify's scaffold requires by default.

---

## Remaining Uncertain Candidates

None. The repository is now exactly what it claims to be: A pure Shopify monorepo containing 6 embedded applications and their direct hosting configs, plus the operational documentation required to run them.
