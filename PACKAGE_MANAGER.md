# JavaScript package manager policy

This monorepo is standardized on **npm** for all JavaScript applications.

## Scope

The following app directories must use npm:

- `Craftline/`
- `FixitCSV/`
- `Stagewise/`
- `customsready/`
- `frontend/`

## Enforcement rules

1. Each app `package.json` declares `"packageManager": "npm@10.8.2"`.
2. Deterministic installs must use lockfiles and npm CI mode in automation:
   - `npm ci`
   - `npm ci --omit=dev` for production dependencies only
3. `yarn.lock` and `pnpm-lock.yaml` are not allowed in these app directories.
4. `package-lock.json` files are committed and treated as the source of truth for dependency resolution.
