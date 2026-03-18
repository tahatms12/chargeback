// app/db.server.ts
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

// Prevent multiple Prisma instances during hot reload in development.
// Implementation choice: global singleton pattern, standard for Remix + Prisma.
declare global {
  // eslint-disable-next-line no-var
  var __db__: PrismaClient | undefined;
}

function getDb(): PrismaClient {
  if (!global.__db__) {
    global.__db__ = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }
  return global.__db__;
}

export const db = getDb();
