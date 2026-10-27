"use client";
import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions/auth";

export function NavbarLogoutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="flex items-center gap-1 text-sm text-slate-700 hover:text-amber-700"
      >
        <LogOut size={16} /> Log out
      </button>
    </form>
  );
}
