"use client";
import { useEffect, useState } from "react";

export function Countdown({ closesAt, label = "Closes in" }: { closesAt: string; label?: string }) {
  const [remain, setRemain] = useState(() => new Date(closesAt).getTime() - Date.now());

  useEffect(() => {
    const t = setInterval(() => {
      setRemain(new Date(closesAt).getTime() - Date.now());
    }, 1000);
    return () => clearInterval(t);
  }, [closesAt]);

  if (remain <= 0) return <span className="font-medium text-slate-600">Closed</span>;
  const s = Math.floor(remain / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return (
    <span className="tabular-nums font-medium text-amber-700" aria-live="polite">
      {label} {d > 0 && `${d}d `}{h}h {m}m {sec}s
    </span>
  );
}
