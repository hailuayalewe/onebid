"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { Gavel } from "lucide-react";
import { placeBidAction } from "@/app/actions/admin";

export function BidForm({
  drawId,
  min,
  max,
  currency,
  loggedIn,
  fee,
}: {
  drawId: string;
  min: string;
  max: string;
  currency: string;
  loggedIn: boolean;
  fee: string;
}) {
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const { register, handleSubmit, formState } = useForm<{ amount: number }>({
    defaultValues: { amount: Number(min) },
  });

  const onSubmit = handleSubmit(async (data) => {
    const fd = new FormData();
    fd.set("drawId", drawId);
    fd.set("amount", String(data.amount));
    const res: any = await placeBidAction(undefined, fd);
    if (res?.ok) {
      setMsg({ ok: true, text: `Bid accepted at ${res.balanceAfter} demo credits remaining.` });
    } else {
      setMsg({ ok: false, text: res?.error ?? "Something went wrong." });
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-lg border p-4 bg-white" aria-describedby="bid-help">
      <div id="bid-help" className="text-sm text-slate-600">
        Choose an amount between {min} and {max} {currency}. Fee: {fee || "0"} demo credits per bid.
      </div>
      <div>
        <label className="block text-sm font-medium" htmlFor="amount">Your bid</label>
        <input
          id="amount"
          type="number"
          step={0.01}
          {...register("amount", { required: true, min: Number(min), max: Number(max), validate: (v) => v > 0 })}
          className="mt-1 w-full rounded-md border px-3 py-2 focus:outline-amber-600"
        />
        {formState.errors.amount && (
          <p role="alert" className="text-sm text-rose-600">Amount out of range</p>
        )}
      </div>
      {msg && <p role="status" className={`text-sm ${msg.ok ? "text-emerald-700" : "text-rose-600"}`}>{msg.text}</p>}
      <button
        type="submit"
        disabled={!loggedIn || formState.isSubmitting}
        className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-4 py-2 text-white font-semibold hover:bg-amber-700 disabled:opacity-50"
      >
        <Gavel size={18} /> {formState.isSubmitting ? "Placing bid…" : "Place bid"}
      </button>
    </form>
  );
}
