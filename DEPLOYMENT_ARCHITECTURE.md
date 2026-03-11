# Deployment Architecture (Split Runtime: Vercel + Docker)

## 1) Vercel suitability audit (no persistent workers / long-running backend state)

| App path | Runtime profile | Vercel fit | Decision |
|---|---|---|---|
| `frontend/` | Next.js marketing/site frontend only (`next build`, no worker process) | ✅ Native fit | Deploy on Vercel |
| `customsready/` | Shopify Remix app with Prisma DB sessions + queue workers (`bullmq`, `workers` script) | ❌ Requires long-running worker/backend state | Docker-hosted |
| `FixitCSV/` | Shopify Remix app with Prisma-backed session/state and long-lived app server expectations | ⚠️ Not targeted for this repo's Vercel deployment profile | Docker-hosted |
| `Stagewise/` | Remix + queue/background processing semantics | ❌ Worker/backend dependent | Docker-hosted |
| `Craftline/` | Remix + Prisma + app server state | ❌ Backend state dependent | Docker-hosted |
| `QuoteLoop/QuoteLoop/` | Node backend modules + polling/webhooks | ❌ Long-running service behavior | Docker-hosted |
| `migratory/Migratory/` | Scanner/report server modules for backend processing | ❌ Backend processing dependent | Docker-hosted |
| `app/` + root Python files | FastAPI/Python service runtime | ❌ Not a Vercel frontend target in this architecture | Docker-hosted |

## 2) Selected production split

- **Vercel scope:** `frontend/` only.
- **Docker scope:** all backend/worker-dependent services (Shopify Remix backends, queue workers, Python API services, and other long-running processors).

This avoids serverless assumptions for workloads that need persistent state, workers, or durable process lifecycles.

## 3) Request routing model

Public traffic is expected to be routed by the gateway in `gateway/nginx.conf`:

- `/` → Vercel-hosted `frontend/` app (or your chosen site hostname)
- `/customsready/*` → Docker-hosted `customsready` service
- `/chargeback/*` → Docker/external Chargeback upstream
- `/poref/*` → Docker/external PORef upstream

If you do not use this exact Nginx gateway, mirror the same path contracts in your ingress/load balancer.

## 4) Docker deployment path for excluded services

Use one of the compose entry points:

- `docker-compose.yml` for core local/service orchestration.
- `docs/docker-compose.paths.example.yml` as a documentation-only path-based gateway reference (contains placeholders; not runnable as-is).
- Service-local Dockerfiles (for example `customsready/Dockerfile`, `FixitCSV/Dockerfile`) for independent app images.

Recommended pattern:

1. Build each backend/worker image from its app directory.
2. Inject per-service environment variables (`*_DATABASE_URL`, Redis, Shopify secrets, etc.).
3. Run Remix/FastAPI web process and any required worker process as separate Docker services.
4. Expose only via gateway/ingress path routing.

## 5) Vercel install/build + lockfile strategy

Root `vercel.json` is intentionally constrained to `frontend/`:

- Install: `npm ci --prefix frontend`
- Build: `npm run build --prefix frontend`

This ensures Vercel uses **only** `frontend/package-lock.json` and does not attempt to install/build backend packages in other subdirectories.

## 6) Operational guardrails

- Do not assume serverless background execution for queues, polling, or webhook retries.
- Keep worker processes in Docker/Kubernetes where uptime and restart policy are explicit.
- Keep Prisma migrations tied to backend deploy pipelines, not Vercel frontend deploys.
