const requiredVars = ["SHOPIFY_API_KEY", "SHOPIFY_API_SECRET", "SHOPIFY_APP_URL", "DATABASE_URL"] as const;

type RequiredVar = (typeof requiredVars)[number];

function requireEnv(name: RequiredVar): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  SHOPIFY_API_KEY: requireEnv("SHOPIFY_API_KEY"),
  SHOPIFY_API_SECRET: requireEnv("SHOPIFY_API_SECRET"),
  SHOPIFY_APP_URL: requireEnv("SHOPIFY_APP_URL"),
  DATABASE_URL: requireEnv("DATABASE_URL"),
};
