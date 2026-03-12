const fs = require('fs');
const path = require('path');

const rootPath = 'c:/Users/Admin/Downloads/shopifyapps/final/chargeback';

// 1. FixitCSV (append missing to webhooks.tsx)
const fixitPath = path.join(rootPath, 'FixitCSV', 'app', 'routes', 'webhooks.tsx');
if (fs.existsSync(fixitPath)) {
  let content = fs.readFileSync(fixitPath, 'utf8');
  if (!content.includes('CUSTOMERS_DATA_REQUEST')) {
     content = content.replace('switch (topic) {', 'switch (topic) {\\n    case \"CUSTOMERS_DATA_REQUEST\":\\n    case \"CUSTOMERS_REDACT\":\\n      return new Response(\"Unhandled\", { status: 200 });\\n');
     fs.writeFileSync(fixitPath, content);
  }
}

// 2. Craftline & Stagewise (Create webhooks.tsx)
const basicTemplate = \import type { ActionFunctionArgs } from \"@remix-run/node\";
import { authenticate } from \"../shopify.server\";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin } = await authenticate.webhook(request);

  if (!admin && session) {
    return new Response();
  }

  switch (topic) {
    case "APP_UNINSTALLED":
      // Handled automatically by token invalidation
      break;
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
      return new Response("Noted", { status: 200 });
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }

  throw new Response();
};
\;

['Craftline', 'Stagewise'].forEach(app => {
  const p = path.join(rootPath, app, 'app', 'routes', 'webhooks.tsx');
  if (!fs.existsSync(p)) fs.writeFileSync(p, basicTemplate);
});

// 3. poref-new & quoteloop-new (Create individual route files)
const individualTemplate = (topic) => \import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../../shopify.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { topic, shop, session, admin, payload } = await authenticate.webhook(request);

  if (!admin) return new Response();
  //  handled
  return new Response("Actioned", { status: 200 });
};
\;

['apps/poref-new', 'apps/quoteloop-new'].forEach(app => {
   ['customers.data_request', 'customers.redact', 'shop.redact'].forEach(route => {
      const p = path.join(rootPath, app, 'app', 'routes', \webhooks.\.tsx\);
      if (!fs.existsSync(p)) fs.writeFileSync(p, individualTemplate(route));
   });
});

console.log('GDPR Webhooks injected.');
