import { describe, expect, it } from "vitest";
import { valueDcf } from "../dcf";

describe("valueDcf", () => {
  it("computes a positive fair value with all inputs present", () => {
    const result = valueDcf({
      fcf: 100,
      revenueGrowth: 0.08,
      beta: 1.2,
      totalDebt: 200,
      cash: 50,
      sharesOutstanding: 100,
      riskFreeRate: 0.04,
    });

    expect(result.unavailableReason).toBeNull();
    expect(result.fairValue).not.toBeNull();
    expect(result.fairValue as number).toBeGreaterThan(0);
  });

  it("is unavailable when FCF is missing", () => {
    const result = valueDcf({
      fcf: null,
      revenueGrowth: 0.08,
      beta: 1,
      totalDebt: 0,
      cash: 0,
      sharesOutstanding: 100,
      riskFreeRate: 0.04,
    });
    expect(result.fairValue).toBeNull();
    expect(result.unavailableReason).toContain("Dato no disponible");
  });

  it("is unavailable when FCF is negative", () => {
    const result = valueDcf({
      fcf: -10,
      revenueGrowth: 0.08,
      beta: 1,
      totalDebt: 0,
      cash: 0,
      sharesOutstanding: 100,
      riskFreeRate: 0.04,
    });
    expect(result.fairValue).toBeNull();
  });

  it("is unavailable when risk free rate is missing", () => {
    const result = valueDcf({
      fcf: 100,
      revenueGrowth: 0.08,
      beta: 1,
      totalDebt: 0,
      cash: 0,
      sharesOutstanding: 100,
      riskFreeRate: null,
    });
    expect(result.fairValue).toBeNull();
    expect(result.unavailableReason).toContain("Dato no disponible");
  });

  it("falls back to beta=1 and documents the assumption when beta is missing", () => {
    const result = valueDcf({
      fcf: 100,
      revenueGrowth: 0.05,
      beta: null,
      totalDebt: 0,
      cash: 0,
      sharesOutstanding: 100,
      riskFreeRate: 0.04,
    });
    expect(result.fairValue).not.toBeNull();
    expect(result.assumptions.note).toContain("beta=1");
  });
});
