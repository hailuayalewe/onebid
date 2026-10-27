"use client";
import { useActionState } from "react";
import { suspendUserAction, creditAdjustAction } from "@/app/actions/admin";

export function UsersAdminRow({ user }: {
  user: { id: string; email: string; name: string | null; role: string; suspended: boolean; suspendReason: string | null; creditBalance: string; bidCount: number };
}) {
  const [susp, suspAction, suspPending] = useActionState(suspendUserAction, undefined as any);
  const [adj, adjAction] = useActionState(creditAdjustAction, undefined as any);

  return (
    <tr className={`border-b ${user.suspended ? "bg-rose-50" : ""}`}>
      <td className="p-2">{user.email}</td>
      <td className="p-2">{user.name}</td>
      <td className="p-2">{user.role}</td>
      <td className="p-2 font-medium">{user.creditBalance}</td>
      <td className="p-2">{user.bidCount}</td>
      <td className="p-2">{user.suspended ? `Suspended (${user.suspendReason})` : "Active"}</td>
      <td className="p-2">
        <div className="flex gap-3 items-center">
          <form action={suspAction} className="inline">
            <input type="hidden" name="userId" value={user.id} />
            <input type="hidden" name="suspended" value={(!user.suspended).toString()} />
            {user.suspended ? <input type="hidden" name="reason" value="Reactivated" /> : null}
            <button className={user.suspended ? "text-emerald-700 underline" : "text-rose-700 underline"}>
              {suspPending ? "…" : user.suspended ? "Reactivate" : "Suspend"}
            </button>
          </form>
          <details className="inline">
            <summary className="list-none cursor-pointer text-sm text-amber-700 underline">Adjust credits</summary>
            <form action={adjAction} className="mt-1 flex items-center gap-1">
              <input type="hidden" name="userId" value={user.id} />
              <input name="amount" type="number" step={0.01} placeholder="±amount" className="w-24 rounded border px-2 py-1" />
              <input name="note" required placeholder="Reason" className="w-32 rounded border px-2 py-1" />
              <button className="rounded bg-amber-600 px-2 py-1 text-white">Apply</button>
            </form>
          </details>
          {susp?.error && <span role="alert" className="text-rose-600 text-xs">{susp.error}</span>}
          {adj?.ok && <span className="text-emerald-600 text-xs">adjusted</span>}
        </div>
      </td>
    </tr>
  );
}
