import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const now = new Date();
  const [totalUsers, active, upcoming, completed, totalBids, recentAudit] = await Promise.all([
    prisma.user.count(),
    prisma.draw.count({ where: { status: "ACTIVE", closesAt: { gt: now } } }),
    prisma.draw.count({ where: { status: "UPCOMING" } }),
    prisma.draw.count({ where: { status: { in: ["CLOSED", "SETTLED"] } } }),
    prisma.bid.count(),
    prisma.adminAuditLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5 text-center">
        {[["Total users", totalUsers], ["Active draws", active], ["Upcoming draws", upcoming], ["Completed draws", completed], ["Total demo bids", totalBids]].map(([l, v]) => (
          <div key={l as string} className="rounded-xl border bg-white p-4">
            <div className="text-3xl font-extrabold">{String(v)}</div>
            <div className="text-sm text-slate-600">{l}</div>
          </div>
        ))}
      </div>
      <section className="space-y-2">
        <h2 className="text-lg font-bold">Recent administrative activity</h2>
        <ul className="text-sm rounded-lg border bg-white divide-y">
          {recentAudit.length === 0 ? (
            <li className="p-3 text-slate-500">No administrative activity recorded yet.</li>
          ) : (
            recentAudit.map((a) => (
              <li key={a.id} className="p-3 flex flex-col gap-0.5">
                <span className="font-medium">{a.action}</span>
                <span className="text-xs text-slate-500">{a.actorEmail} · {new Date(a.createdAt).toLocaleString()} · {a.targetType} {a.targetId}</span>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
