import pkg from "@prisma/client";
const { PrismaClient } = pkg;

declare global {
  // eslint-disable-next-line no-var
  var __db: typeof PrismaClient.prototype | undefined;
}

export const db =
  global.__db ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__db = db;
}
