import Link from "next/link";
import { Trophy, Info, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-white mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-8 grid gap-6 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2 font-bold">
            <Trophy className="text-amber-600" size={20} /> DemoBid
          </div>
          <p className="text-sm text-slate-600 mt-2">
            A DEMO lowest-unique-bid competition platform. Demo credits only — no real prizes, payments or withdrawals.
            Not affiliated with OneBid.et.
          </p>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-2">Site</div>
          <Link className="block text-slate-700 hover:text-amber-700" href="/draws">Draws</Link>
          <Link className="block text-slate-700 hover:text-amber-700" href="/how-it-works">How it works</Link>
          <Link className="block text-slate-700 hover:text-amber-700" href="/contact">Contact</Link>
        </div>
        <div className="text-sm">
          <div className="font-semibold mb-2">Legal</div>
          <Link className="block text-slate-700 hover:text-amber-700" href="/terms">Terms</Link>
          <Link className="block text-slate-700 hover:text-amber-700" href="/privacy">Privacy policy</Link>
          <div className="text-xs text-slate-500 mt-4 flex gap-1"><Info size={14} /> DE notification: demo credits, no withdrawals.</div>
          <div className="text-xs text-slate-500 flex gap-1 mt-1"><Mail size={14} /> demo support only</div>
        </div>
      </div>
    </footer>
  );
}
