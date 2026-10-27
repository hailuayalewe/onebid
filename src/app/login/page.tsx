"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { useActionState } from "react";
import { loginAction } from "@/app/actions/auth";

export default function LoginPage() {
  const [state, action, pending] = useActionState(loginAction, undefined as any);
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-3xl font-bold">Log in</h1>
      <form action={action} className="space-y-3 rounded-xl border bg-white p-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input id="email" name="email" type="email" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium">Password</label>
          <input id="password" name="password" type="password" required className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        {state?.error && <p role="alert" className="text-sm text-rose-600">{state.error}</p>}
        <button disabled={pending} className="w-full rounded-md bg-amber-600 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
          {pending ? "Signing in…" : "Log in"}
        </button>
      </form>
      <p className="text-sm text-slate-600">No demo account? Demo user: demo@demo.local / DemoPass-2026!</p>
    </div>
  );
}
