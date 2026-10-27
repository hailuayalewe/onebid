import { listDraws, type DrawSummary } from "@/services/draws";
import { DrawCard } from "@/components/draw-card";
import Link from "next/link";
import { Search, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DrawsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const status = ["ACTIVE", "UPCOMING", "CLOSED", "SETTLED"].includes(sp.status ?? "") ? sp.status : undefined;
  const draws = await listDraws({ q: sp.q, status, sort: sp.sort });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold flex items-center gap-2"><Trophy className="text-amber-600" size={26} /> Draws</h1>

      <form className="flex flex-wrap gap-3" action="/draws">
        <label htmlFor="q" className="sr-only">Search</label>
        <input
          id="q"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search prizes…"
          className="flex-1 min-w-[12rem] rounded-md border px-3 py-2 focus:outline-amber-600"
        />
        <label htmlFor="status" className="sr-only">Status</label>
        <select id="status" name="status" defaultValue={sp.status ?? ""} className="rounded-md border px-3 py-2">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="UPCOMING">Upcoming</option>
          <option value="CLOSED">Completed</option>
          <option value="SETTLED">Settled</option>
        </select>
        <label htmlFor="sort" className="sr-only">Sort</label>
        <select id="sort" name="sort" defaultValue={sp.sort ?? "closesAt"} className="rounded-md border px-3 py-2">
          <option value="closesAt">Closing soonest</option>
          <option value="opensAt">Opening soonest</option>
        </select>
        <button className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-4 py-2 text-white hover:bg-amber-700">
          <Search size={16} /> Filter
        </button>
      </form>

      {draws.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center text-slate-500">
          No draws match your search. <Link className="text-amber-700 underline" href="/draws">Clear filters</Link> or check back later.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {draws.map((d) => (
            <DrawCard key={d.id} draw={d} />
          ))}
        </div>
      )}
    </div>
  );
}
