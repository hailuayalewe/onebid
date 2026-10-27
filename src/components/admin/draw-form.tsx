"use client";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { drawUpsertAction } from "@/app/actions/admin";

export type DrawFormValues = {
  slug: string; title: string; prizeName: string; description: string;
  currency: string; bidPrecision: number; minBid: number; maxBid: number;
  bidCreditFee: number; status: string; opensAt: string; closesAt: string;
  image1src: string; image1alt: string;
};

export function DrawForm({ initial }: { initial?: Partial<DrawFormValues> }) {
  const [msg, setMsg] = useState("");
  const { register, handleSubmit } = useForm<DrawFormValues>({
    defaultValues: { currency: "ETB", bidPrecision: 2, bidCreditFee: 0, status: "DRAFT", ...initial } as any,
  });

  return (
    <form
      action={async (fd: any) => {
        const res: any = await drawUpsertAction(undefined, fd);
        setMsg(res?.ok ? "Saved." : res?.error ?? "Failed.");
      }}
      className="grid gap-3 md:grid-cols-2 rounded-lg border bg-white p-4"
    >
      <input {...register("slug")} placeholder="slug (lowercase-dashes)" className="border rounded px-3 py-2" />
      <input {...register("title")} placeholder="Title" className="border rounded px-3 py-2" />
      <input {...register("prizeName")} placeholder="Prize name" className="border rounded px-3 py-2" />
      <input {...register("currency")} placeholder="Currency" className="border rounded px-3 py-2" />
      <textarea {...register("description")} placeholder="Description" rows={3} className="border rounded px-3 py-2 md:col-span-2" />
      <label className="text-sm">Min bid<input type="number" step={0.01} {...register("minBid")} className="mt-1 w-full border rounded px-2 py-1" /></label>
      <label className="text-sm">Max bid<input type="number" step={0.01} {...register("maxBid")} className="mt-1 w-full border rounded px-2 py-1" /></label>
      <label className="text-sm">Demo-credit fee per bid<input type="number" step={0.01} {...register("bidCreditFee")} className="mt-1 w-full border rounded px-2 py-1" /></label>
      <label className="text-sm">Bid precision (digits)<input type="number" min={0} max={4} {...register("bidPrecision")} className="mt-1 w-full border rounded px-2 py-1" /></label>
      <label className="text-sm">Opens at<input type="datetime-local" {...register("opensAt")} className="mt-1 w-full border rounded px-2 py-1" /></label>
      <label className="text-sm">Closes at<input type="datetime-local" {...register("closesAt")} className="mt-1 w-full border rounded px-2 py-1" /></label>
      <label className="text-sm">Status<select {...register("status")} className="mt-1 w-full border rounded px-2 py-1">
        {["DRAFT", "UPCOMING", "ACTIVE", "PAUSED", "CLOSED"].map((s) => <option key={s} value={s}>{s}</option>)}
      </select></label>
      <input {...register("image1src")} placeholder="Image URL (/draws/tablet.svg)" className="border rounded px-3 py-2" />
      <input {...register("image1alt")} placeholder="Image alt" className="border rounded px-3 py-2" />
      {msg && <p className="text-sm md:col-span-2 text-slate-700">{msg}</p>}
      <button className="rounded-md bg-amber-600 py-2 font-semibold text-white hover:bg-amber-700 md:col-span-2">Save draw</button>
    </form>
  );
}
