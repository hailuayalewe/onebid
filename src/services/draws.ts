import "server-only";
import { prisma } from "@/lib/db";

export type DrawSummary = {
  id: string;
  slug: string;
  title: string;
  prizeName: string;
  description: string;
  currency: string;
  minBid: string;
  maxBid: string;
  bidCreditFee: string;
  status: "DRAFT" | "UPCOMING" | "ACTIVE" | "PAUSED" | "CLOSED" | "SETTLED";
  opensAt: string;
  closesAt: string;
  image: string | null;
  imageAlt: string | null;
  bidCount: number;
  result?: {
    hasWinner: boolean;
    winningAmount: string | null;
    winnerEmail: string | null;
    settledAt: string;
    winUserId: string | null;
  } | null;
};

function toSummary(d: any): DrawSummary {
  const img = d.prizeImages?.[0];
  return {
    id: d.id,
    slug: d.slug,
    title: d.title,
    prizeName: d.prizeName,
    description: d.description,
    currency: d.currency,
    minBid: String(d.minBid),
    maxBid: String(d.maxBid),
    bidCreditFee: String(d.bidCreditFee),
    status: d.status,
    opensAt: d.opensAt.toISOString(),
    closesAt: d.closesAt.toISOString(),
    image: img?.src ?? null,
    imageAlt: img?.alt ?? null,
    bidCount: (d as any)._count?.bids ?? 0,
    result: d.result
      ? {
          hasWinner: d.result.hasWinner,
          winningAmount: d.result.winningAmount
            ? String(d.result.winningAmount)
            : null,
          winnerEmail: null,
          settledAt: d.result.settledAt.toISOString(), winUserId: d.result.winUserId,
        }
      : null,
  };
}

export async function listDraws(opts?: {
  q?: string;
  status?: string;
  sort?: string;
  limit?: number;
}): Promise<DrawSummary[]> {
  const where: any = { status: { not: "DRAFT" } };
  if (opts?.status && ["UPCOMING", "ACTIVE", "PAUSED", "CLOSED", "SETTLED"].includes(opts.status))
    where.status = opts.status;
  if (opts?.q)
    where.OR = [
      { title: { contains: opts.q } },
      { prizeName: { contains: opts.q } },
      { description: { contains: opts.q } },
    ];

  const validSort = opts?.sort === "closesAt" || opts?.sort === "opensAt" ? opts.sort : "closesAt";
  const draws = await prisma.draw.findMany({
    where,
    orderBy: { [validSort]: "asc" },
    take: opts?.limit ?? 100,
    include: { prizeImages: true, result: true, _count: { select: { bids: true } } },
  });
  return draws.map(toSummary);
}

export async function getDrawBySlug(slug: string): Promise<DrawSummary | null> {
  const d = await prisma.draw.findUnique({
    where: { slug },
    include: {
      prizeImages: { orderBy: { sortOrder: "asc" } },
      result: true,
      _count: { select: { bids: true } },
    },
  });
  if (!d || d.status === "DRAFT") return null;
  return toSummary(d);
}

export async function getPublicResult(drawId: string) {
  const r = await prisma.drawResult.findUnique({
    where: { drawId },
  });
  if (!r) return null;
  const winUser = r.winUserId
    ? await prisma.user.findUnique({ where: { id: r.winUserId }, select: { email: true } })
    : null;
  return {
    hasWinner: r.hasWinner,
    winningAmount: r.winningAmount ? String(r.winningAmount) : null,
    winnerEmail: winUser?.email ?? null,
    settledAt: r.settledAt.toISOString(),
    settledBy: r.settledBy,
  };
}
