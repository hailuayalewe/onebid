import Link from "next/link";
import { prisma } from "@/lib/db";
import { DrawForm } from "@/components/admin/draw-form";

export const dynamic = "force-dynamic";

export default async function AdminDrawsPage() {
  const draws = await prisma.draw.findMany({ orderBy: { closesAt: "desc" } });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Draw management</h1>
      <details>
        <summary className="cursor-pointer font-semibold">+ New draw</summary>
        <div className="mt-3"><DrawForm /></div>
      </details>
      <ul className="text-sm divide-y rounded-lg border bg-white">
        {draws.map((d) => (
          <li key={d.id} className="p-3 flex justify-between items-center">
            <div>
              <Link href={`/draws/${d.slug}`} className="font-semibold hover:text-amber-700">{d.title}</Link>
              <div className="text-xs text-slate-500">{d.status} · closes {d.closesAt.toLocaleString()} · fee {String(d.bidCreditFee)}</div>
            </div>
            <details><summary className="text-sm text-amber-700 cursor-pointer underline">Edit</summary>
              <div className="mt-3 w-[640px]"><DrawForm initial={{ slug: d.slug, title: d.title, prizeName: d.prizeName, description: d.description, currency: d.currency, bidPrecision: d.bidPrecision, minBid: Number(d.minBid), maxBid: Number(d.maxBid), bidCreditFee: Number(d.bidCreditFee), status: d.status } as any} /></div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
