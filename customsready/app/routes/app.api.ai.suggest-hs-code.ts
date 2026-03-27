import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { db } from "~/db.server";

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== "POST") {
    return json({ error: "Method not allowed" }, { status: 405 });
  }

  const { session } = await authenticate.admin(request);
  const { productTitle, productDescription } = await request.json();

  if (!productTitle) {
    return json({ error: "Product title is required" }, { status: 400 });
  }

  try {
    // Check trial limits
    const config = await db.configuration.findUnique({
      where: { shopDomain: session.shop },
    });

    const currentUsage = config?.aiLookupCount || 0;
    if (currentUsage >= 3) {
      return json(
        { error: "Free trial limit reached (3/3 used). Please upgrade for more AI lookups." },
        { status: 403 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey.trim() === "") {
      return json(
        { error: "GEMINI_API_KEY is not configured on the server. Please set it in Netlify environment variables." },
        { status: 500 }
      );
    }

    // Call Gemini REST API
    const prompt = `You are a customs classification expert.
For the following product, return ONLY a 6-digit Harmonized System (HS) code.
Do NOT include any explanation, punctuation, spaces or dots — just the 6 digits.
Product: "${productTitle}"${productDescription ? `\nDescription: "${productDescription}"` : ""}\nResponse (6 digits only):`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 10,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    let hsCode = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    
    // Clean up code (just in case)
    hsCode = hsCode.replace(/[^0-9]/g, "").substring(0, 6);

    if (!hsCode || hsCode.length < 4) {
      throw new Error("Invalid format returned by AI");
    }

    // Increment usage
    await db.configuration.upsert({
      where: { shopDomain: session.shop },
      create: {
        shopDomain: session.shop,
        aiLookupCount: 1,
      },
      update: {
        aiLookupCount: { increment: 1 },
      },
    });

    return json({ 
      success: true, 
      hsCode, 
      usageRemaining: 3 - (currentUsage + 1) 
    });

  } catch (error: any) {
    console.error("[suggest-hs-code] Failed:", error);
    return json({ error: error.message || "Failed to suggest HS Code due to an unexpected server issue." }, { status: 500 });
  }
}
