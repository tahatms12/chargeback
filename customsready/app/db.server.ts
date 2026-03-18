// app/db.server.ts
import pkg from "@prisma/client";
const { PrismaClient } = pkg;

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}
export const db: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

// Prevent multiple PrismaClient instances in development (HMR)
export const db: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__prisma = db;
}
