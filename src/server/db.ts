import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as typeof globalThis & {
  projectDashboardPrisma?: PrismaClient;
};

export function getPrisma(): PrismaClient {
  if (globalForPrisma.projectDashboardPrisma) {
    return globalForPrisma.projectDashboardPrisma;
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required.");
  }

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });
  globalForPrisma.projectDashboardPrisma = prisma;

  return prisma;
}
