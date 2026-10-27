import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <article className="prose prose-sm max-w-2xl space-y-4">
      <h1 className="text-3xl font-bold">How it works</h1>
      <p>DemoBid is a <strong>DEMO</strong> of a lowest-unique-bid platform. Every prize runs a draw where entrants pick a bid amount inside a published range. Here is the flow:</p>
      <ol className="list-decimal list-inside space-y-2">
        <li><strong>Register a demo account.</strong> New demo accounts receive a configurable starting balance of simulated demo credits. Demo credits are not real currency and cannot be withdrawn or purchased.</li>
        <li><strong>Browse open draws.</strong> Each draw shows the prize, opening time, closing time, bid limits, and demo-credit fee per bid.</li>
        <li><strong>Choose your amount.</strong> The idea is to bid <em>low</em> — the winning amount when the draw closes is the <strong>lowest amount that exactly one entrant used</strong>.</li>
        <li><strong>Closing & settlement.</strong> When a draw closes, only bids accepted before closing count. Amounts are tallied; amounts used by one entrant are unique; the lowest unique amount wins. If no amount occurs exactly once, the draw has no winner.</li>
        <li><strong>Results.</strong> Settled results are shown publicly on the draw page, and winners are reflected in <Link href="/account/bids">My Bids</Link>.</li>
      </ol>
      <p className="text-xs text-slate-500">
        Default demo rule: each accepted bid is one entry, even if the same participant bids the same amount twice — that amount then loses uniqueness. This rule is applied consistently in the engine, database, UI, and tests, and documented in the README.
      </p>
      <p className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm">
        This is a simulation: no payments are processed, no prizes are shipped, and demo credits have no cash value and cannot be used for withdrawals.
      </p>
    </article>
  );
}
