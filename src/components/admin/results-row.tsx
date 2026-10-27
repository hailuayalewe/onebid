"use client";
import { useActionState, useEffect, useState } from "react";
import { settleDrawAction } from "@/app/actions/admin";

export function ResultAdminRow({ draw }: {
  draw: { id: string; slug: string; title: string; status: string; closesAt: string; currency: string };
}) {
  const [state, action, pending] = useActionState(settleDrawAction, undefined as any);
  return (
    <div className={`rounded-lg border p-4 ${draw.status === "SETTLED" ? "bg-purple-50" : "bg-white"}`}>
      <div className="flex justify-between items-start gap-4">
        <div>
          <a href={`/draws/${draw.slug}`} className="font-semibold hover:text-amber-700">{draw.title}</a>
          <div className="text-xs text-slate-500">{draw.status} · closed {new Date(draw.closesAt).toLocaleString()}</div>
        </div>
        <form action={action}>
          <input type="hidden" name="drawId" value={draw.id} />
          <button type="submit" disabled={pending || draw.status === "SETTLED"} className="rounded-md bg-amber-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-40">
            {draw.status === "SETTLED" ? "Settled" : pending ? "Settling…" : "Preview & settle"}
          </button>
        </form>
      </div>
      {state?.ok ? (
        <p className="mt-2 text-sm">
          {state.hasWinner
            ? `Winning amount ${String(state.winningAmount)} ${draw.currency} — ${state.winnerEmail || "awarded"}`
            : "No lowest unique amount; no eligible winner."}
        </p>
      ) : state?.error ? (
        <p role="alert" className="mt-2 text-sm text-rose-600">{state.error}</p>
      ) : null}
    </div>
  );
}
