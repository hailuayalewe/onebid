import { prisma } from "@/lib/db";
import Link from "next/link";
import { ResultAdminRow } from "@/components/admin/results-row";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  const draws = await prisma.draw.findMany({
    where: { status: { in: ["CLOSED", "SETTLED"] } },
    orderBy: { closesAt: "desc" },
    select: { id: true, slug: true, title: true, status: true, closesAt: true, currency: true },
  });

  if (draws.length === 0)
    return <p className="rounded-lg border border-dashed p-8 text-slate-500">No closed or settled draws yet.</p>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Results management</h1>
      <p className="text-xs text-slate-500">Preview eligible bids and uniqueness counts, then settle. Settlement is idempotent and audited.</p>
      {draws.map((d) => (
        <ResultAdminRow
          key={d.id}
          draw={{ id: d.id, slug: d.slug, title: d.title, status: d.status, closesAt: d.closesAt.toISOString(), currency: d.currency }}
        />
      ))}
    </div>
  );
}
