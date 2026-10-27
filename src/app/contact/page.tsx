"use client";
import { useActionState } from "react";
import { contactAction } from "@/app/actions/contact";

export default function ContactPage() {
  const [state, action, pending] = useActionState(contactAction, undefined as any);
  return (
    <div className="mx-auto max-w-sm space-y-4">
      <h1 className="text-3xl font-bold">Contact (demo)</h1>
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
          <label htmlFor="message" className="block text-sm font-medium">Message</label>
          <textarea id="message" name="message" rows={4} required className="mt-1 w-full rounded-md border px-3 py-2" />
        </div>
        {state?.ok && <p role="status" className="text-sm text-emerald-700">Thanks — your message was recorded (demo only, no real delivery).</p>}
        {state?.error && <p role="alert" className="text-sm text-rose-600">{state.error}</p>}
        <button disabled={pending} className="w-full rounded-md bg-amber-600 py-2 font-semibold text-white hover:bg-amber-700 disabled:opacity-50">
          {pending ? "Sending…" : "Send message"}
        </button>
      </form>
      <p className="text-xs text-slate-500">This is a demo contact form. Nothing is delivered to a real inbox.</p>
    </div>
  );
}
