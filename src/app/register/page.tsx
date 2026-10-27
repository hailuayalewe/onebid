"use client";
import { useActionState } from "react";
import { registerAction } from "@/app/actions/auth";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(registerAction, undefined as any);
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-3xl font-bold">Create demo account</h1>
      <form action={action} className="space-y-3 rounded-xl border bg-white p-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium">Name</label>
          <input id="name" name="name" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Password (8+ characters)</label>
          <input id="password" name="password" type="password" required minLength={8} className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        {state?.error && <p role="alert" className="text-sm text-rose-600">{state.error}</p>}
        <button disabled={pending} className="w-full rounded-md bg-amber-600 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
          {pending ? "Creating…" : "Sign up"}
        </button>
      </form>
      <p className="text-xs text-slate-500">DEMO only. New accounts receive a starting balance of simulated demo credits. Not real currency, not withdrawable.</p>
    </div>
  );
}
