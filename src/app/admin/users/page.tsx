import { prisma } from "@/lib/db";
import { UsersAdminRow } from "@/components/admin/users-row";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string; filter?: string }> }) {
  const sp = await searchParams;
  const where: any = {};
  if (sp.q) where.OR = [{ email: { contains: sp.q } }, { name: { contains: sp.q } }];
  if (sp.filter === "suspended") where.suspended = true;
  if (sp.filter === "active") where.suspended = false;

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, name: true, role: true, suspended: true, suspendReason: true, creditBalance: true, createdAt: true, _count: { select: { bids: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User management</h1>
      <form className="flex gap-2" action="/admin/users">
        <input name="q" defaultValue={sp.q} placeholder="Search email or name" className="rounded-md border px-3 py-2 flex-1" />
        <select name="filter" defaultValue={sp.filter} className="rounded-md border px-3 py-2">
          <option value="">All accounts</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
        <button className="rounded-md bg-amber-600 px-4 py-2 text-white hover:bg-amber-700">Search</button>
      </form>
      <table className="w-full text-sm rounded-lg border bg-white">
        <thead><tr className="text-left border-b"><th className="p-2">Email</th><th className="p-2">Name</th><th className="p-2">Role</th><th className="p-2">Credits</th><th className="p-2">Bids</th><th className="p-2">Status</th><th className="p-2">Actions</th></tr></thead>
        <tbody>
          {users.map((u) => (
            <UsersAdminRow key={u.id} user={{ id: u.id, email: u.email, name: u.name, role: u.role, suspended: u.suspended, suspendReason: u.suspendReason, creditBalance: String(u.creditBalance), bidCount: u._count.bids }} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
