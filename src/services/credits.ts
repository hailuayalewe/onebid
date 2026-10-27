import "server-only";
import { prisma } from "@/lib/db";
import { creditAdjustSchema } from "@/lib/validation";

/** Immutable demo-credit ledger helpers. Never returns real currency. */

export function startingDemoCredits(): number {
  const n = Number(process.env.STARTING_DEMO_CREDITS ?? 500);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function bidDemoCreditFee(): number {
  const n = Number(process.env.BID_DEMO_CREDIT_FEE ?? 0);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export async function getBalance(userId: string): Promise<number> {
  const u = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { creditBalance: true },
  });
  const n = Number(u.creditBalance);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Audited admin adjustment. Called from admin server actions that already
 * verified ADMIN role. amount may be negative; balance can never go below 0.
 */
export async function adminAdjustCredits(
  actor: { id: string | null; email: string },
  original: unknown
): Promise<void> {
  const { userId, amount, note } = creditAdjustSchema.parse(original);
  await prisma.$transaction(async (tx) => {
    const user = (await tx.$queryRawUnsafe(
      "SELECT id, creditBalance FROM users WHERE id = ? FOR UPDATE",
      userId
    )) as Array<{ id: string; creditBalance: string }>;
    if (!user.length) throw new Error("User not found");
    const current = Number(user[0].creditBalance);
    if (current === null || !Number.isFinite(current)) throw new Error("Bad balance");
    const next = current + amount;
    if (next < 0) throw new Error("Balance cannot become negative");
    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: next },
    });
    await tx.demoCreditTransaction.create({
      data: {
        userId,
        type: "ADJUSTMENT",
        amount,
        balanceAfter: next,
        note: `${note} (by ${actor.email})`,
      },
    });
    await tx.adminAuditLog.create({
      data: {
        actorId: actor.id,
        actorEmail: actor.email,
        action: "credit.adjust",
        targetType: "user",
        targetId: userId,
        details: JSON.stringify({ amount, note }),
      },
    });
  });
}
