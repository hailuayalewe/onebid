import { describe, it, expect } from "vitest";
import { evaluateDraw, lowestUnique, normalizeAmount, compareDecimal } from "@/lib/engine";

const bid = (id: string, amount: string, opts?: Partial<{ accepted: boolean; before: boolean }>) => ({
  id,
  amount,
  accepted: opts?.accepted ?? true,
  submittedBeforeCloses: opts?.before ?? true,
});

describe("normalizeAmount", () => {
  it("trims trailing zeros and keeps precision", () => {
    expect(normalizeAmount("12.500")).toBe("12.5");
    expect(normalizeAmount("0.10")).toBe("0.1");
    expect(normalizeAmount("12")).toBe("12");
    expect(normalizeAmount("00012.50")).toBe("12.5");
  });
  it("rejects malformed values", () => {
    for (const bad of ["-1", "abc", "1e3", "1.2.3", "", "1,5", "1-5"])
      expect(() => normalizeAmount(bad)).toThrow(RangeError);
    // zero and small amounts normalize fine; zero enforcement happens in the service compare
    expect(normalizeAmount("0")).toBe("0");
    expect(normalizeAmount("0.05")).toBe("0.05");
  });
});

describe("compareDecimal", () => {
  it("compares exact decimals without floats", () => {
    expect(compareDecimal("12.50", "12.5")).toBe(0);
    expect(compareDecimal("12.50", "12.51")).toBeLessThan(0);
    expect(compareDecimal("2000000000", "1000000000")).toBeGreaterThan(0);
  });
});

describe("lowestUnique", () => {
  it("counts entries per amount", () => {
    const counts = lowestUnique([{ amount: "2" }, { amount: "2" }, { amount: "1.5" }]);
    expect(counts).toEqual([
      { amount: "1.5", entries: 1, isUnique: true },
      { amount: "2", entries: 2, isUnique: false },
    ]);
  });
});

describe("evaluateDraw", () => {
  it("one unique bid wins", () => {
    const r = evaluateDraw([bid("a", "9")]);
    expect(r.hasWinner).toBe(true);
    if (r.hasWinner) expect(r.winningAmount).toBe("9");
  });

  it("lowest of several unique amounts wins", () => {
    const r = evaluateDraw([bid("a", "5"), bid("b", "2"), bid("c", "7"), bid("d", "2")]);
    expect(r.hasWinner).toBe(true);
    if (r.hasWinner) {
      expect(r.winningAmount).toBe("5");
      expect(r.winningBidIds).toEqual(["a"]);
    }
  });

  it("multiple bids at the same amount are not unique", () => {
    const r = evaluateDraw([bid("a", "3"), bid("b", "3"), bid("c", "8")]);
    expect(r.hasWinner).toBe(true);
    if (r.hasWinner) expect(r.winningAmount).toBe("8");
  });

  it("same participant bidding twice at same amount makes it non-unique (default rule)", () => {
    const r = evaluateDraw(
      bidsSameUser()
    );
    expect(r.hasWinner).toBe(true);
    if (r.hasWinner) expect(r.winningAmount).toBe("4");
  });

  function bidsSameUser() {
    return [
      { id: "b1", userId: "u1", amount: "3", accepted: true, submittedBeforeCloses: true },
      { id: "b2", userId: "u1", amount: "3", accepted: true, submittedBeforeCloses: true },
      { id: "b3", userId: "u2", amount: "4", accepted: true, submittedBeforeCloses: true },
    ];
  }

  it("no unique amounts → no winner", () => {
    const r = evaluateDraw([bid("a", "1"), bid("b", "1"), bid("c", "2"), bid("d", "2")]);
    expect(r.hasWinner).toBe(false);
    if (!r.hasWinner) {
      expect(r.winningAmount).toBeNull();
      expect(r.counts.every((c) => !c.isUnique)).toBe(true);
    }
  });

  it("invalid / non-accepted bids are excluded", () => {
    const r = evaluateDraw([bid("a", "1", { accepted: false }), bid("b", "5")]);
    expect(r.hasWinner).toBe(true);
    if (r.hasWinner) expect(r.winningAmount).toBe("5");
  });

  it("bids submitted after closing are excluded (even if accepted)", () => {
    const r = evaluateDraw([bid("a", "1", { before: false }), bid("b", "6")]);
    expect(r.hasWinner).toBe(true);
    if (r.hasWinner) {
      expect(r.winningAmount).toBe("6");
      expect(r.winningBidIds).toEqual(["b"]);
    }
  });
});
