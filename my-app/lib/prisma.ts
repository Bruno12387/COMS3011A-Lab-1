import { PrismaClient } from "./generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});

const createPrismaClient = () =>
  new PrismaClient({ adapter }).$extends({
    result: {
      task: {
        overdue: {
          needs: { dueDate: true, status: true },
          compute(task) {
            return task.status !== "COMPLETE" && task.dueDate < new Date();
          },
        },
      },
    },
  });

type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma?: ExtendedPrismaClient };

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;