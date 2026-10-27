import { PrismaClient } from "@prisma/client";
const p = new PrismaClient() as any;
p.$queryRawUnsafe("SELECT migration_name, finished_at, rolled_back_at, logs FROM _prisma_migrations")
  .then((r: any[]) => console.log(JSON.stringify(r, null, 1)))
  .finally(() => p.$disconnect());
