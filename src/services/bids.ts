import "server-only";
import { prisma } from "@/lib/db";
import { bidDemoCreditFee } from "@/services/credits";
import { normalizeAmount, compareDecimal } from "@/lib/engine";

export type SubmitBidResult =
  | { ok: true; bidId: string; amount: string; balanceAfter: number }
  | { ok: false; error: string };

function roundToPrecision(n: number, precision: number): string {
  const p = Math.pow(10, precision);
  return (Math.round(n * p) / p).toString();
}

/**
 * Submit a bid for a draw. All validation and deduction happen on the server in
 * one atomic transaction; the server's clock is authoritative.
 *
 * DEMO rule: every accepted bid is an entry; repeated amounts by any entrants
 * make that amount non-unique (matches src/lib/engine.ts + README).
 */
export async function submitBid(
  userId: string,
  drawId: string,
  rawAmount: number
): Promise<SubmitBidResult> {
  if (typeof rawAmount !== "number" || !Number.isFinite(rawAmount) || rawAmount <= 0) {
    return { ok: false, error: "Bid amount must be a positive number" };
  }

  try {
    return await prisma.$transaction(async (tx) => {
      // Serialize against other deductions: lock the user row first.
      const users = (await tx.$queryRawUnsafe(
        "SELECT id, creditBalance, suspended FROM users WHERE id = ? FOR UPDATE",
        userId
      )) as Array<{ id: string; creditBalance: string; suspended: number }>;
      if (!users.length) return { ok: false, error: "User not found" };
      if (users[0].suspended) return { ok: false, error: "Account suspended" };

      const draw = await tx.draw.findUnique({ where: { id: drawId } });
      if (!draw) return { ok: false, error: "Draw not found" };

      // Server clock is authoritative.
      const now = new Date();
      if (now < draw.opensAt) return { ok: false, error: "This draw has not opened yet" };
      if (now >= draw.closesAt) return { ok: false, error: "This draw is closed" };
      if (draw.status !== "ACTIVE")
        return { ok: false, error: "This draw is not accepting bids" };

      const amountStr = roundToPrecision(rawAmount, draw.bidPrecision);
      const amountNormalized = normalizeAmount(amountStr);

      if (compareDecimal(amountNormalized, normalizeAmount(draw.minBid.toString())) < 0)
        return { ok: false, error: `Minimum bid is ${draw.minBid} ${draw.currency}` };
      if (compareDecimal(amountNormalized, normalizeAmount(draw.maxBid.toString())) > 0)
        return { ok: false, error: `Maximum bid is ${draw.maxBid} ${draw.currency}` };

      const balance = Number(users[0].creditBalance) || 0;
      const fee =
        Number(draw.bidCreditFee) > 0 ? Number(draw.bidCreditFee) : bidDemoCreditFee();

      let newBalance = balance;
      if (fee > 0) {
        if (balance < fee)
          return { ok: false, error: "Insufficient demo credits for this bid" };
        newBalance = balance - fee;
        await tx.user.update({
          where: { id: userId },
          data: { creditBalance: newBalance },
        });
      }

      const bid = await tx.bid.create({
        data: { drawId: draw.id, userId, amount: amountNormalized },
      });

      if (fee > 0) {
        await tx.demoCreditTransaction.create({
          data: {
            userId,
            type: "BID_FEE",
            amount: -fee,
            balanceAfter: newBalance,
            drawId: draw.id,
            bidId: bid.id,
            note: `Bid fee for draw ${draw.slug}`,
          },
        });
      }

      return {
        ok: true,
        bidId: bid.id,
        amount: amountNormalized,
        balanceAfter: newBalance,
      };
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Bid submission failed";
    return { ok: false, error: msg };
  }
}
