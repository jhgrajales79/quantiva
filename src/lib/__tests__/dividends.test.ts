import { describe, expect, it } from "vitest";
import { computeDpsTtm, computeDividendCagr } from "../dividends";

describe("computeDpsTtm", () => {
  it("returns null when there are no dividends", () => {
    expect(computeDpsTtm([])).toBeNull();
  });

  it("sums only dividends within the trailing 12 months from the latest date", () => {
    const dividends = [
      { exDate: "2024-01-01", amount: 0.5 }, // fuera de ventana
      { exDate: "2025-06-01", amount: 0.25 },
      { exDate: "2025-09-01", amount: 0.25 },
      { exDate: "2025-12-01", amount: 0.25 },
      { exDate: "2026-03-01", amount: 0.25 },
    ];
    expect(computeDpsTtm(dividends)).toBeCloseTo(1.0, 6);
  });
});

describe("computeDividendCagr", () => {
  it("returns null when there isn't a full window `years` ago", () => {
    const dividends = [{ exDate: "2026-01-01", amount: 1 }];
    expect(computeDividendCagr(dividends, 5)).toBeNull();
  });

  it("computes CAGR between the recent and the past 12-month window", () => {
    const dividends = [
      { exDate: "2020-06-01", amount: 0.5 },
      { exDate: "2020-09-01", amount: 0.5 },
      { exDate: "2020-12-01", amount: 0.5 },
      { exDate: "2021-03-01", amount: 0.5 }, // pastTtm = 2.0, ventana que termina 5 años antes de 2026-03-01
      { exDate: "2025-06-01", amount: 1 },
      { exDate: "2025-09-01", amount: 1 },
      { exDate: "2025-12-01", amount: 1 },
      { exDate: "2026-03-01", amount: 1 }, // recentTtm = 4.0
    ];
    const cagr = computeDividendCagr(dividends, 5);
    expect(cagr).toBeCloseTo(Math.pow(4 / 2, 1 / 5) - 1, 6);
  });
});
