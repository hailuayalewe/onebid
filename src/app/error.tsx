"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="py-20 text-center space-y-4">
      <h1 className="text-3xl font-extrabold">Something went wrong</h1>
      <p className="text-slate-600">
        An unexpected error occurred. Please try again. (Technical details are not shown here for security reasons.)
      </p>
      <button onClick={reset} className="rounded-md bg-amber-600 px-4 py-2 font-semibold text-white hover:bg-amber-700">
        Try again
      </button>
      <p className="text-xs text-slate-500">Reference: {error.digest ?? "unknown"}</p>
    </div>
  );
}
