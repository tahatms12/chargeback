import pkg from "@prisma/client";
const { PrismaClient } = pkg;

declare global {
  // eslint-disable-next-line no-var
  var prisma: InstanceType<typeof PrismaClient> | undefined;
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") global.prisma = prisma;

export default prisma;
export { prisma as db };
