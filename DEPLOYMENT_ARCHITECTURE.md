# Deployment Architecture (Path-Based Multi-App Hosting)

## 1) Current deployment model discovered in repo
- `vercel.json` was configured to build and serve the `frontend/` Next.js website at root (`/`).
- `customsready/` is a standalone Shopify Remix app (`shopify.app.toml`, app entry files, and Dockerfile exist).
- `poref/` contains Shopify app configuration and architecture docs, but no complete runtime package/entrypoint is present in this repo snapshot.
- A standalone `chargeback/` folder is not present in this checkout; therefore routing for Chargeback is treated as an external immutable service target.

## 2) New production architecture
A root reverse proxy gateway (Nginx) now handles all public traffic on one domain and path-routes to three independent services:

- `https://uplifttechnologies.pro/chargeback` → Chargeback upstream service
- `https://uplifttechnologies.pro/customsready` → CustomsReady service
- `https://uplifttechnologies.pro/poref` → PORef upstream service

Root (`/`) is intentionally disabled and returns HTTP `410 Gone` to remove the old website frontend from public serving.

## 3) Routing behavior
Implemented in `gateway/nginx.conf`:

- Prefix routing with prefix stripping:
  - `/chargeback/*` strips `/chargeback` before upstream forwarding.
  - `/customsready/*` strips `/customsready`.
  - `/poref/*` strips `/poref`.
- Canonical trailing slash redirects:
  - `/chargeback` → `/chargeback/`
  - `/customsready` → `/customsready/`
  - `/poref` → `/poref/`
- Query strings are preserved by default in Nginx rewrites/proxy forwarding.
- WebSocket/streaming upgrade headers are forwarded.
- `X-Forwarded-*` and `X-Forwarded-Prefix` headers are set for embedded app awareness.

## 4) Runtime wiring
`docker-compose.paths.yml` provides a production-oriented reference topology:

- `gateway` service runs Nginx with env-templated upstream host/port values.
- `customsready` runs from `customsready/Dockerfile`.
- `chargeback` and `poref` are explicitly externalizable/replaceable upstream targets so each app remains independently deployable.

> Important: Chargeback immutability is preserved by routing only. No source edits were made for Chargeback.

## 5) Environment isolation strategy
Use strict per-app namespaces at infra/deployment level:

- `CHARGEBACK_*` (e.g., upstream host/port, Shopify URL values managed outside code)
- `CUSTOMSREADY_*`
- `POREF_*`

No shared mutable runtime state is introduced by this gateway design.

## 6) HTTPS-safe assumptions
Terminate TLS at your ingress/load balancer/CDN and forward to gateway over internal network.
Gateway preserves `X-Forwarded-Proto` for app-side secure URL generation and auth callback correctness.

## 7) Operational notes
- The old `frontend/` website remains in-repo but is disconnected from this public routing architecture.
- If platform routing is not Docker-based, mirror these exact path rules in your managed ingress (Nginx Ingress, ALB rules, Caddy, Traefik, etc.).
