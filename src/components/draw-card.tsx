import Link from "next/link";
import { Clock, ImageOff } from "lucide-react";
import type { DrawSummary } from "@/services/draws";
import { Countdown } from "./countdown";

const statusStyle: Record<DrawSummary["status"], string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  UPCOMING: "bg-blue-100 text-blue-800",
  ACTIVE: "bg-emerald-100 text-emerald-800",
  PAUSED: "bg-yellow-100 text-yellow-800",
  CLOSED: "bg-slate-200 text-slate-700",
  SETTLED: "bg-purple-100 text-purple-800",
};

export function DrawCard({ draw }: { draw: DrawSummary }) {
  return (
    <Link
      href={`/draws/${draw.slug}`}
      className="group block rounded-xl border bg-white overflow-hidden shadow-sm hover:shadow-md transition"
    >
      <div className="aspect-[4/3] bg-slate-100 flex items-center justify-center">
        {draw.image ? (
          <img
            src={draw.image}
            alt={draw.imageAlt ?? draw.prizeName}
            className="w-full h-full object-cover"
          />
        ) : (
          <ImageOff className="text-slate-400" size={32} />
        )}
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold rounded-full px-2 py-0.5 ${statusStyle[draw.status]}`}>
            {draw.status}
          </span>
          <span className="text-xs text-slate-500">{draw.bidCount} bids</span>
        </div>
        <h3 className="font-semibold leading-tight group-hover:text-amber-700">{draw.title}</h3>
        <div className="text-sm text-slate-600">
          Bids {draw.minBid}–{draw.maxBid} {draw.currency}
        </div>
        {draw.status === "ACTIVE" ? (
          <Countdown closesAt={draw.closesAt} />
        ) : draw.status === "UPCOMING" ? (
          <div className="text-sm text-slate-500 flex items-center gap-1"><Clock size={14} /> Opens soon</div>
        ) : draw.status === "SETTLED" && draw.result ? (
          <div className="text-sm text-purple-800">
            {draw.result.hasWinner ? `Winning ${draw.result.winningAmount} ${draw.currency}` : "No winner"}
          </div>
        ) : (
          <div className="text-sm text-slate-500">Bidding ended</div>
        )}
      </div>
    </Link>
  );
}
