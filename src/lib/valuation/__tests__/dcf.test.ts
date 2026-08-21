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

  it("caps an abnormal one-off growth spike instead of compounding it for 5 years", () => {
    const result = valueDcf({
      fcf: 100,
      revenueGrowth: 0.534, // ej. salto puntual por una adquisición
      beta: 1,
      totalDebt: 0,
      cash: 0,
      sharesOutstanding: 100,
      riskFreeRate: 0.04,
    });
    expect(result.assumptions.growthCapped).toBe(true);
    expect(result.assumptions.growthRateUsed).toBeCloseTo(0.2);
    expect(result.assumptions.rawGrowthRate).toBeCloseTo(0.534);
    expect(result.assumptions.note).toContain("capado");
  });

  it("does not cap growth at or below the ceiling", () => {
    const result = valueDcf({
      fcf: 100,
      revenueGrowth: 0.15,
      beta: 1,
      totalDebt: 0,
      cash: 0,
      sharesOutstanding: 100,
      riskFreeRate: 0.04,
    });
    expect(result.assumptions.growthCapped).toBe(false);
    expect(result.assumptions.growthRateUsed).toBeCloseTo(0.15);
  });

  it("floors the WACC-terminal spread instead of returning null when beta is near zero", () => {
    const result = valueDcf({
      fcf: 100,
      revenueGrowth: 0.05,
      beta: 0.16, // ej. beta anómalamente bajo reportado por el proveedor
      totalDebt: 0,
      cash: 0,
      sharesOutstanding: 100,
      riskFreeRate: 0.0465,
    });
    expect(result.unavailableReason).toBeNull();
    expect(result.fairValue).not.toBeNull();
    expect(result.assumptions.waccFloored).toBe(true);
    expect(result.assumptions.wacc as number).toBeCloseTo(0.025 + 0.035);
    expect(result.assumptions.note).toContain("colchón mínimo");
  });

  it("does not floor the WACC when the spread over terminal growth is already healthy", () => {
    const result = valueDcf({
      fcf: 100,
      revenueGrowth: 0.05,
      beta: 1.2,
      totalDebt: 0,
      cash: 0,
      sharesOutstanding: 100,
      riskFreeRate: 0.04,
    });
    expect(result.assumptions.waccFloored).toBe(false);
    expect(result.assumptions.wacc).toBeCloseTo(result.assumptions.rawWacc as number);
  });
});
