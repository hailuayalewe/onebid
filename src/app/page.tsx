import Link from "next/link";
import { Sparkles, ChevronRight } from "lucide-react";
import { listDraws, type DrawSummary } from "@/services/draws";
import { DrawCard } from "@/components/draw-card";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const draws = await listDraws({ limit: 60 });
  const active = draws.filter((d) => d.status === "ACTIVE");
  const upcoming = draws.filter((d) => d.status === "UPCOMING");
  const done = draws.filter((d) => ["CLOSED", "SETTLED"].includes(d.status));

  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 text-white p-8 md:p-12">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">Lowest unique bid wins</h1>
        <p className="mt-3 max-w-xl text-amber-50">
          Pick a prize, choose a small bid amount and bid low. When a draw closes, whoever entered
          the lowest unique amount takes it. Demo credits only — this is a simulation with no real
          prizes or payments.
        </p>
        <div className="mt-6 flex gap-3">
          <Link href="/draws" className="inline-flex items-center gap-1 rounded-md bg-white px-4 py-2 font-semibold text-amber-700 hover:bg-amber-50">
            Browse draws <ChevronRight size={18} />
          </Link>
          <Link href="/how-it-works" className="rounded-md border border-white/60 px-4 py-2 hover:bg-white/10">
            How it works
          </Link>
        </div>
      </section>

      <Section title="Active draws" items={active} emptyText="No active draws right now." />
      <Section title="Upcoming draws" items={upcoming} emptyText="No upcoming draws scheduled." />
      <Section title="Completed draws" items={done} emptyText="Completed draws will appear here." />
    </div>
  );
}

function Section({ title, items, emptyText }: { title: string; items: DrawSummary[]; emptyText: string }) {
  return (
    <section id={title.slice(0, -6)}>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Sparkles className="text-amber-600" size={20} /> {title}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-slate-500">{emptyText}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((d) => (
            <DrawCard key={d.id} draw={d} />
          ))}
        </div>
      )}
    </section>
  );
}
