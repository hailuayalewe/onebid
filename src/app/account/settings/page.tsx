import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function AccountSettingsPage() {
  const session = await auth();
  return (
    <div className="space-y-4 max-w-md">
      <h1 className="text-2xl font-bold">Account settings</h1>
      <div className="rounded-lg border bg-white p-4 text-sm space-y-2">
        <p className="font-semibold">Demo program</p>
        <p className="text-slate-600">This is a demo account. Demo credits are simulated and carry no real value. They cannot be withdrawn, purchased or exchanged for cash. Payments are not supported in this demo.</p>
        <p className="font-semibold mt-3">Log out</p>
        <Link href="/logout" className="text-amber-700 underline">End your session →</Link>
      </div>
      <p className="text-xs text-slate-500">Signed in as {(session?.user as any)?.email}</p>
    </div>
  );
}
