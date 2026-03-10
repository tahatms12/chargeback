// prisma/seed.ts
// Seeds default production stages for a given shop domain.
// Invoked during onboarding or manually via: npm run prisma:seed SHOP=example.myshopify.com

import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DEFAULT_STAGES = [
  {
    name: "Order Received",
    position: 1,
    color: "#5C6AC4",
    emailSubject: "We received your order {{orderNumber}}!",
    emailBody: `<p>Hi {{customerName}},</p>
<p>Great news — we've received your order <strong>{{orderNumber}}</strong> and it's in our queue.</p>
<p>We'll update you as it moves through production.</p>
<p>Thank you,<br>{{shopName}}</p>`,
    sendEmail: true,
  },
  {
    name: "Materials Sourcing",
    position: 2,
    color: "#EEC200",
    emailSubject: "Your order {{orderNumber}} — materials being sourced",
    emailBody: `<p>Hi {{customerName}},</p>
<p>Your order <strong>{{orderNumber}}</strong> has moved to the <em>Materials Sourcing</em> stage. We're gathering everything needed to make your item.</p>
<p>Thank you,<br>{{shopName}}</p>`,
    sendEmail: false,
  },
  {
    name: "In Production",
    position: 3,
    color: "#F49342",
    emailSubject: "Your order {{orderNumber}} is being made!",
    emailBody: `<p>Hi {{customerName}},</p>
<p>Your order <strong>{{orderNumber}}</strong> is now <em>In Production</em>. We're actively working on it.</p>
<p>Thank you,<br>{{shopName}}</p>`,
    sendEmail: true,
  },
  {
    name: "Quality Check",
    position: 4,
    color: "#9C6ADE",
    emailSubject: "Almost there — quality checking your order {{orderNumber}}",
    emailBody: `<p>Hi {{customerName}},</p>
<p>Your order <strong>{{orderNumber}}</strong> is in our final quality check before shipping.</p>
<p>Thank you,<br>{{shopName}}</p>`,
    sendEmail: false,
  },
  {
    name: "Ready to Ship",
    position: 5,
    color: "#47C1BF",
    emailSubject: "Your order {{orderNumber}} is packed and ready!",
    emailBody: `<p>Hi {{customerName}},</p>
<p>Your order <strong>{{orderNumber}}</strong> is packed and ready to be handed off to the carrier. You'll receive a separate shipping confirmation once it's on its way.</p>
<p>Thank you,<br>{{shopName}}</p>`,
    sendEmail: true,
  },
];

async function seedDefaultStagesForShop(shopDomain: string) {
  for (const stage of DEFAULT_STAGES) {
    await db.productionStage.upsert({
      where: {
        shopDomain_position: {
          shopDomain,
          position: stage.position,
        },
      },
      update: {},
      create: { shopDomain, ...stage },
    });
  }
  console.log(`Seeded ${DEFAULT_STAGES.length} default stages for ${shopDomain}`);
}

const shopArg = process.argv.find((a) => a.startsWith("SHOP="));
if (shopArg) {
  const shop = shopArg.split("=")[1];
  seedDefaultStagesForShop(shop)
    .catch(console.error)
    .finally(() => db.$disconnect());
} else {
  console.log("Usage: npm run prisma:seed SHOP=example.myshopify.com");
  db.$disconnect();
}

export { seedDefaultStagesForShop };
