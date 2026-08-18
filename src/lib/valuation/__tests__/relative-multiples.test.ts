import { describe, expect, it } from "vitest";
import { valuePeRelative } from "../pe-relative";
import { valueEvEbitda } from "../ev-ebitda";
import { valuePs } from "../ps";
import type { RatiosSnapshot } from "../types";

function ratios(pe: number | null, ps: number | null, evEbitda: number | null): RatiosSnapshot {
  return { fiscalDate: "2024-01-01", pe, ps, evEbitda, revenueGrowth: null };
}

describe("valuePeRelative", () => {
  it("uses the average historical P/E when at least 2 samples exist", () => {
    const result = valuePeRelative(10, [ratios(20, null, null), ratios(24, null, null)]);
    expect(result.fairValue).toBeCloseTo(22 * 10, 6);
  });

  it("is unavailable with fewer than 2 historical samples", () => {
    const result = valuePeRelative(10, [ratios(20, null, null)]);
    expect(result.fairValue).toBeNull();
    expect(result.unavailableReason).toContain("histórico insuficiente");
  });
});

describe("valuePs", () => {
  it("uses average historical P/S applied to revenue per share", () => {
    const result = valuePs(1000, 100, [ratios(null, 5, null), ratios(null, 7, null)]);
    // revenue per share = 10, average P/S = 6 -> fair value = 60
    expect(result.fairValue).toBeCloseTo(60, 6);
  });
});

describe("valueEvEbitda", () => {
  it("subtracts net debt and divides by shares outstanding", () => {
    const result = valueEvEbitda(
      100, // ebitda
      50, // totalDebt
      20, // cash
      10, // sharesOutstanding
      [ratios(null, null, 8), ratios(null, null, 10)],
    );
    // avg multiple = 9, EV = 900, netDebt = 30, equity = 870, /10 = 87
    expect(result.fairValue).toBeCloseTo(87, 6);
  });
});
