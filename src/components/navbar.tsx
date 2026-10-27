import Link from "next/link";
import { Home, Trophy, List, User, LogOut, Menu, X } from "lucide-react";
import { signOut } from "@/lib/auth";
import { NavbarLogoutButton } from "@/components/navbar-logout-button";

export type NavbarUser = {
  name?: string | null;
  email?: string | null;
  role?: string;
} | null;

export function Navbar({ user }: { user: NavbarUser }) {
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/draws", label: "Draws", icon: Trophy },
    ...(user ? [{ href: "/account/bids", label: "My Bids", icon: List }, { href: "/account/profile", label: "Profile", icon: User }] : []),
  ];
  return (
    <nav className="border-b bg-white">
      <div className="mx-auto max-w-6xl px-4 flex h-16 items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <Trophy className="text-amber-600" size={22} />
          DemoBid <span className="text-xs font-normal text-slate-500">DEMO</span>
        </Link>
        <div className="hidden md:flex items-center gap-4">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center gap-1 text-slate-700 hover:text-amber-700">
              <l.icon size={16} /> {l.label}
            </Link>
          ))}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="flex items-center gap-1 text-rose-700 hover:text-rose-900">
              Admin
            </Link>
          )}
        </div>
        <div className="ml-auto hidden md:flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-slate-600">{user.email}</span>
              <NavbarLogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-slate-700 hover:text-amber-700">Log in</Link>
              <Link href="/register" className="rounded-md bg-amber-600 px-3 py-1.5 text-white hover:bg-amber-700">
                Sign up
              </Link>
            </>
          )}
        </div>
        <details className="md:hidden ml-auto relative">
          <summary className="list-none cursor-pointer p-2"><Menu size={20} /></summary>
          <div className="absolute right-0 top-12 w-48 rounded-md bg-white border shadow-lg flex flex-col p-2 z-10">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center gap-2 rounded px-2 py-2 hover:bg-slate-100">
                <l.icon size={16} /> {l.label}
              </Link>
            ))}
            {user?.role === "ADMIN" && (
              <Link href="/admin" className="flex items-center gap-2 rounded px-2 py-2 hover:bg-slate-100 text-rose-700">Admin</Link>
            )}
            {user ? (
              <Link href="/logout" className="flex items-center gap-2 rounded px-2 py-2 hover:bg-slate-100"><LogOut size={16} /> Log out</Link>
            ) : (
              <><Link href="/login" className="px-2 py-2">Log in</Link>
              <Link href="/register" className="px-2 py-2 text-amber-700">Sign up</Link></>
            )}
          </div>
        </details>
      </div>
    </nav>
  );
}
