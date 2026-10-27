import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const uid = (session?.user as any)?.id;
  if (!uid) redirect("/login");
  // Server-side authorization is authoritative — not just hidden UI.
  const user = await prisma.user.findUnique({ where: { id: uid }, select: { role: true, suspended: true } });
  if (!user || user.role !== "ADMIN" || user.suspended) redirect("/");

  return (
    <div className="grid gap-6 md:grid-cols-[180px_1fr]">
      <nav className="space-y-2 text-sm">
        {[
          ["/admin", "Dashboard"],
          ["/admin/draws", "Draws"],
          ["/admin/users", "Users"],
          ["/admin/results", "Results"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="block rounded-md px-3 py-2 hover:bg-rose-50 hover:text-rose-800">{label}</Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
