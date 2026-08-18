import { describe, expect, it } from "vitest";
import { computeReturn } from "../sector-returns";
import type { PricePoint } from "../providers/types";

function point(date: string, close: number): PricePoint {
  return { date, open: null, high: null, low: null, close, volume: null };
}

describe("computeReturn", () => {
  it("returns null when history is empty", () => {
    expect(computeReturn([], "1d")).toBeNull();
  });

  it("computes 1-day return from the second-to-last close", () => {
    const history = [point("2026-01-01", 100), point("2026-01-02", 110)];
    expect(computeReturn(history, "1d")).toBeCloseTo(0.1, 6);
  });

  it("returns null when there isn't enough history for the period", () => {
    const history = [point("2026-01-01", 100)];
    expect(computeReturn(history, "1w")).toBeNull();
  });

  it("computes YTD return from the first close of the current year", () => {
    const history = [
      point("2025-12-31", 90),
      point("2026-01-02", 100),
      point("2026-06-01", 120),
    ];
    // primer cierre del año actual (2026) es 100 -> YTD = (120-100)/100
    expect(computeReturn(history, "ytd")).toBeCloseTo(0.2, 6);
  });
});
