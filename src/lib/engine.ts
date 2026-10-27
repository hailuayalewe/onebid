/**
 * Pure lowest-unique-bid engine.
 *
 * Rule (DEMO default, documented in README):
 * - Each ACCEPTED bid is one entry. Every entry counts toward an amount's tally,
 *   even when the same participant places multiple bids at the same amount.
 * - Uniqueness = an amount whose number of entries is exactly 1.
 * - The winning amount is the lowest unique amount.
 * - Amounts are exact decimal strings; no floating point arithmetic is used here.
 *
 * If you change this rule (e.g. count distinct participants), update this file,
 * the README, the UI, and the tests together.
 */

export type EngineBid = {
  id: string;
  amount: string; // exact decimal string, e.g. "12.50"
  accepted: boolean;
  submittedBeforeCloses: boolean;
};

export type UniquenessCount = {
  amount: string;
  entries: number;
  isUnique: boolean;
};

export type EngineResult =
  | { hasWinner: true; winningAmount: string; winningBidIds: string[]; counts: UniquenessCount[] }
  | { hasWinner: false; winningAmount: null; winningBidIds: []; counts: UniquenessCount[] };

/** Compare two non-negative decimal strings exactly, without floats. */
export function compareDecimal(a: string, b: string): number {
  const na = normalizeAmount(a);
  const nb = normalizeAmount(b);
  const [ai, af] = na.split(".");
  const [bi, bf] = nb.split(".");
  if (ai !== bi) {
    return ai.length !== bi.length
      ? ai.length > bi.length ? 1 : -1
      : ai > bi ? 1 : -1;
  }
  return af > bf ? 1 : af < bf ? -1 : 0;
}

/** Validate + normalize a decimal money string; throws RangeError on malformed input.
 * Keeps input precision (trailing zeros trimmed) so any draw bidPrecision works. */
export function normalizeAmount(input: string): string {
  if (input.includes("e") || input.includes("E"))
    throw new RangeError("Exponent notation is not allowed");
  const m = /^\d+(\.\d+)?$/.test(input) ? input : null;
  if (!m) throw new RangeError("Bid amount is malformed");
  const [int, frac = ""] = input.split(".");
  const fracTrimmed = frac.replace(/0+$/, "");
  return `${int === "" ? "0" : int.replace(/^0+(?=\d)/, "")}${fracTrimmed ? `.${fracTrimmed}` : ""}`;
}

/**
 * Core calculation over bids that have ALREADY been filtered for eligibility
 * (accepted + before closes) by the caller — keeps the engine purely functional.
 */
export function lowestUnique(bids: { amount: string }[]): UniquenessCount[] {
  const tally = new Map<string, number>();
  for (const b of bids) {
    const key = normalizeAmount(b.amount);
    tally.set(key, (tally.get(key) ?? 0) + 1);
  }
  return [...tally.entries()]
    .map(([amount, entries]) => ({ amount, entries, isUnique: entries === 1 }))
    .sort((x, y) => compareDecimal(x.amount, y.amount));
}

export function evaluateDraw(bids: EngineBid[]): EngineResult {
  const eligible = bids.filter((b) => b.accepted && b.submittedBeforeCloses);
  const counts = lowestUnique(
    eligible.map((b) => ({ amount: b.amount }))
  );

  const winner = counts.find((c) => c.isUnique);
  if (!winner) return { hasWinner: false, winningAmount: null, winningBidIds: [], counts };

  const winningBidIds = eligible
    .filter((b) => normalizeAmount(b.amount) === winner.amount)
    .map((b) => b.id);

  return {
    hasWinner: true,
    winningAmount: winner.amount,
    winningBidIds,
    counts,
  };
}
