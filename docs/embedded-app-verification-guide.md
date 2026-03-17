# Shopify Embedded App Verification Guide

Use this guide to verify that each of the six applications in the monorepo is correctly configured as an embedded app and integrates with Shopify App Bridge.

## Prerequisites
1. All apps must be deployed to Netlify.
2. Environment variables (API Key, Secret, Redirect URLs, Database URL) must be configured in Netlify as per [netlify-env-requirements.md](../docs/netlify-env-requirements.md).
3. The Shopify Partner Dashboard must be updated with the correct URLs.

## Verification Checklist (Per App)

### 1. Installation and Auth Flow
- **Step**: Install the app on a development store.
- **Expected**: The app should correctly handle the OAuth handshake and redirect to the `/app` route (e.g., `https://your-site.netlify.app/app`).
- **Standardized Entry**: Accessing the base URL (`https://your-site.netlify.app`) should automatically redirect you to `/app` once authenticated.

### 2. Embedded State & App Bridge
- **Step**: Open the app within the Shopify Admin iFrame (`Apps` > `[Your App Name]`).
- **Expected**: 
    - The layout should be "embedded" (no duplicate scrollbars if possible).
    - The Shopify App Bridge `NavMenu` should appear at the top/side of the iFrame.
    - Check the browser console (DevTools) for any `Missing public key` or App Bridge initialization errors.

### 3. Navigation (NavMenu)
- **Step**: Click through the links in the standardized navigation menu (e.g., "Dashboard", "Settings").
- **Expected**:
    - The URL inside the iFrame should update (e.g., to `/app/settings`).
    - The page should render the correct sub-route view.
    - The outer Shopify Admin should remain stable.

### 4. Database Persistence
- **Step**: Perform an action that saves data (e.g., updating a setting). Refresh the page.
- **Expected**: The data should persist, confirming that the Neon database connection is active and correctly configured on Netlify.

## App-Specific Verification Notes

| App | Key Route to Test | Navigation Links |
| :--- | :--- | :--- |
| **Craftline** | `/app` (Dashboard) | Dashboard |
| **FixitCSV** | `/app` (Dashboard) | Dashboard |
| **Stagewise** | `/app` (Dashboard) | Dashboard, Settings |
| **CustomsReady** | `/app` (Dashboard) | Dashboard, Settings |
| **Poref** | `/app` (Home) | Home, Additional page |
| **QuoteLoop** | `/app` (Home) | Home, Additional page |

## Troubleshooting
- **Refused to frame '...'**: Check that the `Content-Security-Policy` header allows the Shopify domain. The standardized `root.tsx` and `app.tsx` in this monorepo use the official `@shopify/shopify-app-remix` boundary to handle this.
- **Looping Redirects**: Ensure that the `application_url` in `shopify.app.toml` exactly matches the Netlify URL (including the `/app` suffix where configured).
