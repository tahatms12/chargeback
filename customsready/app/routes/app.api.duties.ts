// app/routes/app.api.duties.ts
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { calculateDuties } from "~/lib/dutyCalc";

export async function action({ request }: ActionFunctionArgs) {
  await authenticate.admin(request);
  const { destinationCountry, hsCode, totalValue, currency } = await request.json();
  
  // Calculate duties
  const estimate = calculateDuties(destinationCountry, hsCode || "000000", totalValue, currency, 1);
  
  return json({ estimate });
}
