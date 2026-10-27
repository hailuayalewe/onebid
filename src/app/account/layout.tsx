import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="grid gap-6 md:grid-cols-[180px_1fr]">
      <nav className="space-y-2 text-sm">
        {[
          ["/account/profile", "Profile"],
          ["/account/bids", "My Bids"],
          ["/account/settings", "Settings"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="block rounded-md px-3 py-2 hover:bg-amber-50 hover:text-amber-800">
            {label}
          </Link>
        ))}
      </nav>
      <div>{children}</div>
    </div>
  );
}
