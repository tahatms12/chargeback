import pkg from "@prisma/client";
const { PrismaClient } = pkg;

declare global {
  var __db: PrismaClient | undefined;
}

export const db = global.__db ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__db = db;
