import { PrismaClient } from "@/generated/prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function resolveSqlitePath(databaseUrl: string): string {
  if (databaseUrl === ":memory:") return databaseUrl;

  let filePath = databaseUrl;

  if (databaseUrl.startsWith("file://")) {
    const url = new URL(databaseUrl);
    filePath = decodeURIComponent(url.pathname);
    if (/^\/[A-Za-z]:/.test(filePath)) {
      filePath = filePath.slice(1);
    }
  } else if (databaseUrl.startsWith("file:")) {
    filePath = databaseUrl.slice("file:".length);
  }

  return path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
}

const rawDatabaseUrl = process.env.DATABASE_URL || "file:./data/smartsupport.db";
const sqlitePath = resolveSqlitePath(rawDatabaseUrl);

if (sqlitePath !== ":memory:") {
  fs.mkdirSync(path.dirname(sqlitePath), { recursive: true });
}

const adapter = new PrismaBetterSQLite3({ url: sqlitePath });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
