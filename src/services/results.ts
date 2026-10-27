import "server-only";
import { prisma } from "@/lib/db";
import { evaluateDraw, EngineResult } from "@/lib/engine";

export type SettleResult =
  | { ok: true; hasWinner: boolean; winningAmount: string | null; winnerEmail: string | null }
  | { ok: false; error: string };

/**
 * Idempotent settlement:
 * - The DrawResult row has a unique constraint on drawId; settlement state is
 *   therefore "result inserted".
 * - Settlement becomes a no-op when a DrawResult already exists.
 * - Concurrent calls serialize on that unique index (insert wins, retries see
 *   existing row and return its value).
 */
export async function settleDraw(
  actor: { id: string | null; email: string },
  drawId: string
): Promise<SettleResult> {
  const draw = await prisma.draw.findUnique({
    where: { id: drawId },
    include: { result: true },
  });
  if (!draw) return { ok: false, error: "Draw not found" };

  const existing = draw.result;

  if (existing) {
    const winner = existing.winUserId
      ? await prisma.user.findUnique({
          where: { id: existing.winUserId },
          select: { email: true },
        })
      : null;
    return {
      ok: true,
      hasWinner: existing.hasWinner,
      winningAmount: existing.winningAmount ? String(existing.winningAmount) : null,
      winnerEmail: winner?.email ?? null,
    };
  }

  const bids = await prisma.bid.findMany({
    where: { drawId },
    select: {
      id: true,
      amount: true,
      createdAt: true,
      userId: true,
      user: { select: { email: true } },
    },
  });

  const engine: EngineResult = evaluateDraw(
    bids
      .filter((b) => b.createdAt < draw.closesAt)
      .map((b) => ({
        id: b.id,
        amount: String(b.amount),
        accepted: true,
        submittedBeforeCloses: true,
      }))
  );

  // Find the participant who owns the winning bid (default rule: the bid's owner).
  let winUserId: string | null = null;
  let winnerEmail: string | null = null;
  if (engine.hasWinner && engine.winningBidIds.length > 0) {
    const winBid = bids.find((b) => b.id === engine.winningBidIds[0]);
    if (winBid) {
      winUserId = winBid.userId;
      winnerEmail = winBid.user.email;
    }
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.drawResult.create({
        data: {
          drawId,
          hasWinner: engine.hasWinner,
          winningAmount: engine.winningAmount,
          winUserId,
          settledBy: actor.email,
        },
      });
      await tx.draw.update({
        where: { id: drawId },
        data: { status: "SETTLED" },
      });
      await tx.adminAuditLog.create({
        data: {
          actorId: actor.id,
          actorEmail: actor.email,
          action: "result.settle",
          targetType: "draw",
          targetId: drawId,
          details: JSON.stringify({
            hasWinner: engine.hasWinner,
            winningAmount: engine.winningAmount,
          }),
        },
      });
    });
  } catch (e) {
    // Concurrent settle already inserted a row for this draw: idempotent no-op.
    const existingAfter = await prisma.drawResult.findUnique({
      where: { drawId },
      include: { draw: true },
    });
    if (existingAfter) {
      const winner = existingAfter.winUserId
        ? await prisma.user.findUnique({
            where: { id: existingAfter.winUserId },
            select: { email: true },
          })
        : null;
      return {
        ok: true,
        hasWinner: existingAfter.hasWinner,
        winningAmount: existingAfter.winningAmount
          ? String(existingAfter.winningAmount)
          : null,
        winnerEmail: winner?.email ?? null,
      };
    }
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Result settlement failed",
    };
  }

  return {
    ok: true,
    hasWinner: engine.hasWinner,
    winningAmount: engine.winningAmount,
    winnerEmail,
  };
}
