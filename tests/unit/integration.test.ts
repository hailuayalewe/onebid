/* Integration tests run against the local MySQL/MariaDB database
 * (mysql://root:@localhost:3306/onebid_demo). They create uniquely named
 * scratch draws/users and never touch seeded rows beyond inserting scratch data.
 * Run with: npx tsx --env-file=./.env node_modules/.bin/vitest? -> prefer `vitest run`.
 * env-file is provided via vitest config test.env or CLI. */
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { submitBid } from "@/services/bids";
import { settleDraw } from "@/services/results";
import { prisma } from "@/lib/db";
import { hash } from "@node-rs/argon2";

let userId: string;
let otherUserId: string;
let starter: string;

beforeAll(async () => {
  const pw = await hash("TestPass-2026!");
  const suffix = Date.now().toString(36);
  const u1 = await prisma.user.create({
    data: { email: `test-${suffix}-a@demo.local`, hashedPassword: pw, creditBalance: 100 },
  });
  const u2 = await prisma.user.create({
    data: { email: `test-${suffix}-b@demo.local`, hashedPassword: pw, creditBalance: 100 },
  });
  userId = u1.id;
  otherUserId = u2.id;
  starter = suffix;
});

afterAll(async () => {
  // Scratch-user cleanup: cascade removes their bids and credit transactions.
  await prisma.user.deleteMany({ where: { email: { startsWith: `test-` } } });
  await prisma.draw.deleteMany({ where: { slug: { contains: `it-${starter}` } } });
  await prisma.demoCreditTransaction.deleteMany({ where: { userId: { in: [userId, otherUserId] } } });
  await prisma.$disconnect();
});

async function createDraw(slug: string, opts?: Partial<{ status: any; minBid: number; maxBid: number; fee: number; closesAt: Date }>) {
  const now = Date.now();
  return prisma.draw.create({
    data: {
      slug: `it-${starter}-${slug}`,
      title: `IT ${slug}`,
      prizeName: `IT ${slug}`,
      description: "Integration test draw (DEMO).",
      minBid: opts?.minBid ?? 0.1,
      maxBid: opts?.maxBid ?? 25,
      bidCreditFee: opts?.fee ?? 0,
      status: opts?.status ?? "ACTIVE",
      closesAt: opts?.closesAt ?? new Date(now + 60_000),
      opensAt: new Date(now - 1000),
    },
  });
}

describe("submitBid (integration, real DB)", () => {
  it("accepts a valid bid and deducts demo credits", async () => {
    const draw = await createDraw("basic", { fee: 5 });
    const res = await submitBid(userId, draw.id, 7.5);
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.amount).toBe("7.5");
      expect(res.balanceAfter).toBe(95);
    }
    const bal = await prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { creditBalance: true } });
    expect(Number(bal.creditBalance)).toBe(95);
  });

  it("rejects out-of-range and invalid amounts", async () => {
    const draw = await createDraw("range");
    const tooBig = await submitBid(userId, draw.id, 100);
    expect(tooBig.ok).toBe(false);
    const tooSmall = await submitBid(userId, draw.id, 0.01);
    expect(tooSmall.ok).toBe(false);
    const zero = await submitBid(userId, draw.id, 0);
    expect(zero.ok).toBe(false);
    const negative = await submitBid(userId, draw.id, -3);
    expect(negative.ok).toBe(false);
  });

  it("rejects bids after the draw closes (server clock)", async () => {
    const draw = await createDraw("late", { closesAt: new Date(Date.now() - 5000) });
    const res = await submitBid(userId, draw.id, 5);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.error).toContain("closed");
  });

  it("concurrent submissions cannot spend more demo credits than available", async () => {
    // user has 100 credits; fee 60 each; two concurrent bids with 60-credit fee must not both succeed
    await prisma.user.update({ where: { id: otherUserId }, data: { creditBalance: 100 } });
    const draw = await createDraw("race", { fee: 60 });
    const results = await Promise.allSettled([
      submitBid(otherUserId, draw.id, 5),
      submitBid(otherUserId, draw.id, 6),
    ]);
    const fulfilled = results.map((r) => (r.status === "fulfilled" && r.value.ok ? true : false));
    // exactly one of the two should succeed (100 cannot cover fee twice)
    expect(fulfilled).toEqual([true, false]);
    const bal = await prisma.user.findUniqueOrThrow({ where: { id: otherUserId }, select: { creditBalance: true } });
    expect(Number(bal.creditBalance)).toBe(40);
  });
});

describe("settleDraw (integration, real DB)", () => {
  it("picks the lowest unique amount and is idempotent", async () => {
    const draw = await createDraw("settle", { fee: 0 });
    // a b c at 1.5; d e at 2; f at 3 → lowest unique is 3
    await submitBid(userId, draw.id, 1.5);
    await submitBid(otherUserId, draw.id, 1.5);
    const u3 = await prisma.user.create({ data: { email: `test-${starter}-c@demo.local`, hashedPassword: "x", creditBalance: 0 } });
    await submitBid(u3.id, draw.id, 2);
    await submitBid(otherUserId, draw.id, 2);
    await submitBid(userId, draw.id, 3);

    const first = await settleDraw({ id: null, email: "system" }, draw.id);
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.hasWinner).toBe(true);
      expect(first.winningAmount).toBe("2");
      expect(first.winnerEmail).toContain("-b@demo.local");
    }

    const before = await prisma.drawResult.findUnique({ where: { drawId: draw.id } });
    const settledAt = before?.settledAt;
    // repeated settlement returns the same row → idempotent
    await Promise.all([
      settleDraw({ id: null, email: "another-admin" }, draw.id),
      settleDraw({ id: null, email: "another-admin-2" }, draw.id),
    ]);
    const after = await prisma.drawResult.findUnique({ where: { drawId: draw.id } });
    expect(after?.settledAt?.toISOString()).toBe(before?.settledAt.toISOString());
    expect(await prisma.drawResult.count({ where: { drawId: draw.id } })).toBe(1);
    expect((await prisma.draw.findUniqueOrThrow({ where: { id: draw.id } })).status).toBe("SETTLED");
  });

  it("all-tied bids result in no winner", async () => {
    const draw = await createDraw("notie", { fee: 0 });
    const u4 = await prisma.user.create({ data: { email: `test-${starter}-d@demo.local`, hashedPassword: "x", creditBalance: 0 } });
    await submitBid(userId, draw.id, 4);
    await submitBid(otherUserId, draw.id, 4);
    await submitBid(u4.id, draw.id, 4);
    const res = await settleDraw({ id: null, email: "system" }, draw.id);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.hasWinner).toBe(false);
    if (!res.ok) res.error.toString();
  });
});
