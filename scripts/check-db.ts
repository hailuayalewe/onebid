import { PrismaClient } from "@prisma/client";
const p = new PrismaClient() as any;
p.$queryRawUnsafe("SELECT COUNT(*) AS users FROM users")
  .then((r: any[]) => console.log(JSON.stringify(r)))
  .catch((e: any) => console.log("ERR", e.message))
  .finally(() => p.$disconnect());
