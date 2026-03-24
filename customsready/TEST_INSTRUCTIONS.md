# Test Instructions — CustomsReady Lite

## Installation
1. Click the provided installation URL.
2. Select store: `uplift-technologies-2.myshopify.com`
3. Click Install app to authorize the application.

## Core Functionality
1. Navigate to Apps → CustomsReady Lite.
2. Go to the Orders section.
3. Select order [INSERT TEST ORDER NUMBER HERE].
4. Click "Generate Commercial Invoice".
5. Expected: A PDF is generated and downloaded containing the order data.
6. Click "Generate CN22 Form".
7. Expected: A CN22 form is populated with the order data.
8. Navigate to the HS Code Lookup feature — search for "cotton t-shirt".
9. Expected: Returns matching HS code results.
10. Navigate to Duty Calculator.
11. Input destination: Germany, value: $50 USD.
12. Expected: A duty estimate is returned.

## Billing (CustomsReady Lite Monthly)
1. Upon initial load, or when navigating to a premium feature, the Shopify billing modal will appear.
2. The modal states the "CustomsReady Lite Monthly" plan for $7.00.
3. Approve the test charge.
4. Expected: All app features are unlocked.

## Notes
- Test order [INSERT TEST ORDER NUMBER HERE] is pre-created with an international shipping address.
- Support email: support@uplifttechnologies.pro
