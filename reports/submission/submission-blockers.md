# Shopify App Store Submission Blockers

**Date**: Current Run
**Status**: ⛔ SUBMISSION BLOCKED AT READINESS GATE

## Universal Blocker for All 6 Apps:
**Reason**: Production Backend Routing / Hosting Not Implemented
**Details**: 
The apps were mapped to the unified Vercel frontend (`apps-launch`) via `vercel.json` and custom subdomains. The `apps-launch` proxy successfully serves the beautiful marketing launch pages on the root URL `/`.
**HOWEVER**, the actual Shopify Remix backends (which handle the OAuth flow via `/auth/callback`, webhooks via `/webhooks`, and the embedded app UI via `/app`) are NOT deployed. 
If an arbitrary request is made in production to `https://[app_slug].uplifttechnologies.pro/auth/callback`, the Vercel edge router will 404 because the Remix application container is not running on Vercel or any other PaaS (e.g., Fly.io, Heroku) to receive the traffic. 

**Shopify Review Impact**: 
If submitted in this state, the Shopify Review team will attempt to install the app. The install button will direct them to the `/auth` route, immediately fail with a 404/500, and result in immediate rejection.

**Required Remediation before Final Submit:**
Deploy the 6 Remix backend containers to a competent hosting provider (Fly.io, Heroku, or independent Vercel Remix deployments) and update the `vercel.json` rewrites in the `apps-launch` proxy to correctly route `/auth`, `/api`, `/webhooks`, and `/app` traffic to the backend containers. 

*No final `Submit for Review` button will be pressed. The configurations, App Store draft listings, and logos/screenshots will be fully populated and Saved as Drafts in the Partner Dashboard.*
