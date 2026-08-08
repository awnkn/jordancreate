import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

// Next.js hot-reloads modules in dev, which would otherwise open a new pool of
// connections on every edit. Cache the client on globalThis.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

const makeClient = () =>
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });

export const db = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
