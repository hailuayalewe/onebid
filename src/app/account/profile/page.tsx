import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) return null;
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: (session.user as any).id },
    select: { name: true, email: true, role: true, suspended: true, createdAt: true },
  });
  const tx = await prisma.demoCreditTransaction.findMany({
    where: { userId: (session.user as any).id },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: { id: true, type: true, amount: true, balanceAfter: true, note: true, createdAt: true },
  });
  const balance = Number((await prisma.user.findUniqueOrThrow({ where: { id: user.email ? (session.user as any).id : "" }, select: { creditBalance: true } }))?.creditBalance);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <dl className="grid gap-1 text-sm rounded-lg border bg-white p-4">
        <div><dt className="inline font-medium">Name: </dt><dd className="inline">{user.name}</dd></div>
        <div><dt className="inline font-medium">Email: </dt><dd className="inline">{user.email}</dd></div>
        <div><dt className="inline font-medium">Role: </dt><dd className="inline">{user.role}</dd></div>
        <div><dt className="inline font-medium">Member since: </dt><dd className="inline">{user.createdAt.toLocaleDateString()}</dd></div>
        <div><dt className="inline font-medium">Demo credit balance: </dt><dd className="inline font-bold">{balance}</dd></div>
      </dl>
      <section className="space-y-2">
        <h2 className="text-lg font-bold">Demo credit ledger</h2>
        <p className="text-xs text-slate-500">Simulated demo credits — not real currency, not withdrawable.</p>
        <table className="w-full text-sm rounded-lg border bg-white">
          <thead><tr className="text-left border-b"><th className="p-2">Date</th><th className="p-2">Type</th><th className="p-2">Amount</th><th className="p-2">Balance</th><th className="p-2">Note</th></tr></thead>
          <tbody>
            {tx.length === 0 ? (
              <tr><td colSpan={5} className="p-3 text-slate-500">No demo credit transactions yet.</td></tr>
            ) : tx.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="p-2">{t.createdAt.toLocaleString()}</td>
                <td className="p-2">{t.type}</td>
                <td className={`p-2 font-medium ${Number(t.amount) < 0 ? "text-rose-600" : "text-emerald-700"}`}>{String(t.amount)}</td>
                <td className="p-2">{String(t.balanceAfter)}</td>
                <td className="p-2 text-slate-600">{t.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Link href="/account/bids" className="text-sm text-amber-700 underline">View my bids →</Link>
    </div>
  );
}
