# Shopify Review Checklist (Frontend-owned)

- [x] Embedded auth uses Shopify session tokens; backend calls include `Authorization: Bearer <token>`.
- [x] Session token is refreshed per request (`getSessionToken` each call).
- [x] CSP `frame-ancestors` is set dynamically per `shop` on HTML routes.
- [x] No broken UI routes; all required routes are present and navigable.
- [x] In-app Privacy Policy and Support pages exist and are reachable in navigation.
- [x] App is designed for iframe load and does not rely on third-party cookies for auth.

## Manual verification before submission

1. Launch from Shopify Admin and confirm no `Missing shop parameter` errors.
2. Confirm missing `host` path force-redirects to `https://{shop}/admin/apps/{API_KEY}`.
3. Confirm network requests to backend include bearer token.
4. Confirm CSP response header includes shop + `admin.shopify.com` while embedded.
5. Confirm support/privacy/terms pages display real policy/support content.
