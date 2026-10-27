import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MyBidsPage() {
  const session = await auth();
  if (!session?.user) return null;
  const uid = (session.user as any).id as string;

  const bids = await prisma.bid.findMany({
    where: { userId: uid },
    orderBy: { createdAt: "desc" },
    include: {
      draw: { select: { id: true, slug: true, title: true, currency: true, status: true, result: true } },
    },
  });

  // Group by draw
  const groups = new Map<string, typeof bids>();
  for (const b of bids) groups.set(b.draw.id, [...(groups.get(b.draw.id) ?? []), b]);

  if (bids.length === 0)
    return <p className="rounded-lg border border-dashed p-10 text-center text-slate-500">You haven’t placed any bids yet. Browse the draws to get started.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">My bids</h1>
      {[...groups.entries()].map(([drawId, drawBids]) => {
        const draw = drawBids[0].draw;
        const iWon = draw.result?.hasWinner && draw.result.winUserId === uid;
        return (
          <section key={drawId} className="space-y-2 rounded-lg border bg-white p-4">
            <div className="flex justify-between items-center">
              <a href={`/draws/${draw.slug}`} className="font-semibold hover:text-amber-700">{draw.title}</a>
              <span className="text-xs text-slate-500">{draw.status}</span>
            </div>
            {draw.result && (
              <div className={`text-sm ${iWon ? "font-bold text-emerald-700" : "text-slate-600"}`}>
                {draw.result.hasWinner ? (iWon ? "🎉 You won!" : `Winning amount ${String(draw.result.winningAmount)} ${draw.currency}`) : "No winner"}
              </div>
            )}
            <ul className="text-sm divide-y">
              {drawBids.map((b) => (
                <li key={b.id} className="flex justify-between py-1">
                  <span>{String(b.amount)} {draw.currency}</span>
                  <span className="text-slate-500">{b.createdAt.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
