// app/routes/app.api.hs-code.ts
import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "~/shopify.server";
import { lookupHsCode } from "~/lib/hsCodes";

export async function action({ request }: ActionFunctionArgs) {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent") as string;

  if (intent === "lookup") {
    const title = formData.get("title") as string;
    const hsCode = lookupHsCode(title);
    return json({ hsCode });
  }

  if (intent === "update") {
    const variantId = formData.get("variantId") as string;
    const hsCode = formData.get("hsCode") as string;
    const countryOfOrigin = formData.get("countryOfOrigin") as string;

    const response = await admin.graphql(
      `#graphql
      mutation updateVariantMetafields($input: ProductVariantInput!) {
        productVariantUpdate(input: $input) {
          productVariant {
            id
            metafields(first: 2) {
              edges {
                node {
                  id
                  namespace
                  key
                  value
                }
              }
            }
          }
          userErrors {
            field
            message
          }
        }
      }`,
      {
        variables: {
          input: {
            id: variantId,
            metafields: [
              {
                namespace: "customsready",
                key: "hs_code",
                type: "single_line_text_field",
                value: hsCode,
              },
              {
                namespace: "customsready",
                key: "country_of_origin",
                type: "single_line_text_field",
                value: countryOfOrigin,
              },
            ],
          },
        },
      }
    );
    const result = await response.json();
    return json(result.data);
  }

  return json({ error: "Invalid intent" }, { status: 400 });
}
