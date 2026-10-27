import { notFound } from "next/navigation";
import { getDrawBySlug, getPublicResult } from "@/services/draws";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Countdown } from "@/components/countdown";
import { BidForm } from "@/components/bid-form";
import { BadgeCheck, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DrawDetailsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const draw = await getDrawBySlug(slug);
  if (!draw) notFound();

  const [session, result, userBids] = await Promise.all([
    auth(),
    ["SETTLED"].includes(draw.status) ? getPublicResult(draw.id) : Promise.resolve(null),
    draw.status,
  ]);  const myBids = session?.user
    ? await prisma.bid.findMany({
        where: { drawId: draw.id, userId: (session.user as any).id },
        orderBy: { createdAt: "desc" },
        select: { id: true, amount: true, createdAt: true },
      })
    : [];

  const now = new Date();
  const canBid = draw.status === "ACTIVE" && now >= new Date(draw.opensAt) && now < new Date(draw.closesAt);

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="rounded-xl overflow-hidden border bg-slate-100 aspect-[4/3]">
          {draw.image && <img src={draw.image} alt={draw.imageAlt ?? draw.prizeName} className="w-full h-full object-cover" />}
        </div>
        <h1 className="text-2xl font-bold">{draw.title}</h1>
        <p className="text-slate-700">{draw.description}</p>
        <dl className="text-sm space-y-1 text-slate-600">
          <div>Status: <strong>{draw.status}</strong> · {draw.bidCount} bids</div>
          <div>Opens: {new Date(draw.opensAt).toLocaleString()}</div>
          <div>Closes: {new Date(draw.closesAt).toLocaleString()}</div>
          <div>Bid range: {draw.minBid}–{draw.maxBid} {draw.currency} · demo-credit fee {draw.bidCreditFee}/bid</div>
        </dl>
        <div className="text-sm">
          {draw.status === "ACTIVE" && now < new Date(draw.closesAt) ? <Countdown closesAt={draw.closesAt} /> : null}
        </div>
      </div>

      <div className="space-y-5">
        <div aria-hidden={false}>
          {canBid ? (
            <BidForm
              drawId={draw.id}
              min={draw.minBid}
              max={draw.maxBid}
              currency={draw.currency}
              fee={draw.bidCreditFee}
              loggedIn={Boolean(session?.user)}
            />
          ) : session?.user === null ? (
            <div className="rounded-lg border p-4 text-sm text-slate-600">
              {circleIconInfo()} Log in to place a bid once the draw is active.
            </div>
          ) : (
            <div className="rounded-lg border p-4 text-sm text-slate-600">{circleIconInfo()} Bidding is closed for this draw.</div>
          )}
        </div>

        {result && (
          <section className="space-y-2">
            <h2 className="text-lg font-bold">Result</h2>
            {result.hasWinner ? (
              <div className="rounded-lg border bg-purple-50 p-4 text-sm">
                <BadgeCheck className="inline mr-1 text-purple-700" size={18} />
                Winning amount <strong>{result.winningAmount} {draw.currency}</strong> — awarded to{" "}
                {result.winnerEmail} (settled by {result.settledBy}).
              </div>
            ) : (
              <div className="rounded-lg border bg-slate-50 p-4 text-sm">No lowest unique amount existed among eligible bids.</div>
            )}
          </section>
        )}

        <section className="space-y-2">
          <h2 className="text-lg font-bold">How the lowest unique bid works</h2>
          <ol className="list-decimal list-inside text-sm text-slate-700 space-y-1">
            <li>Every accepted bid entry counts toward its amount’s tally (demo default rule).</li>
            <li>An amount is unique when exactly one entry used it.</li>
            <li>The lowest unique amount wins. If no amount occurs exactly once, there is no winner.</li>
          </ol>
        </section>

        {myBids.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-lg font-bold">Your bids on this draw</h2>
            <ul className="text-sm divide-y rounded-lg border bg-white">
              {myBids.map((b) => (
                <li key={b.id} className="px-3 py-2 flex justify-between">
                  <span>{String(b.amount)} {draw.currency}</span>
                  <span className="text-slate-500">{b.createdAt.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

function circleIconInfo() {
  return <Info className="inline mr-1 text-slate-400" size={16} />;
}
