import { describe, expect, it } from "vitest";
import {
  computeValueScore,
  computeQualityScore,
  computeGrowthScore,
  computeMomentumScore,
  computeInvestmentScore,
  isPossibleValueTrap,
} from "../scores";

describe("computeValueScore", () => {
  it("returns null when no inputs are available", () => {
    expect(computeValueScore({ upsidePct: null, fcfYield: null, dividendYield: null })).toBeNull();
  });

  it("scores higher upside as a higher value score", () => {
    const low = computeValueScore({ upsidePct: -0.2, fcfYield: null, dividendYield: null });
    const high = computeValueScore({ upsidePct: 0.4, fcfYield: null, dividendYield: null });
    expect(high as number).toBeGreaterThan(low as number);
  });
});

describe("computeQualityScore", () => {
  it("penalizes high debt/EBITDA", () => {
    const lowDebt = computeQualityScore({
      roe: 0.15,
      roic: 0.1,
      grossMargin: 0.4,
      operatingMargin: 0.2,
      debtToEbitda: 0.5,
    });
    const highDebt = computeQualityScore({
      roe: 0.15,
      roic: 0.1,
      grossMargin: 0.4,
      operatingMargin: 0.2,
      debtToEbitda: 4.5,
    });
    expect(lowDebt as number).toBeGreaterThan(highDebt as number);
  });
});

describe("computeGrowthScore", () => {
  it("averages revenue and eps growth", () => {
    const score = computeGrowthScore({ revenueGrowth: 0.3, epsGrowth: 0.3 });
    expect(score).toBeCloseTo(100, 4);
  });
});

describe("computeMomentumScore", () => {
  it("returns null when nothing is available", () => {
    expect(
      computeMomentumScore({
        perf1m: null,
        perf3m: null,
        perf6m: null,
        perf12m: null,
        priceVsMa50Pct: null,
        priceVsMa200Pct: null,
      }),
    ).toBeNull();
  });
});

describe("computeInvestmentScore", () => {
  it("renormalizes weights across available scores", () => {
    const score = computeInvestmentScore({
      valueScore: 80,
      qualityScore: 60,
      growthScore: null,
      momentumScore: null,
    });
    // only value (0.3) and quality (0.25) available -> renormalized weights
    const expected = (80 * 0.3 + 60 * 0.25) / (0.3 + 0.25);
    expect(score).toBeCloseTo(expected, 6);
  });
});

describe("isPossibleValueTrap", () => {
  it("flags cheap stocks with declining revenue", () => {
    expect(
      isPossibleValueTrap({
        upsidePct: 0.3,
        revenueGrowth: -0.05,
        fcf: 10,
        debtToEbitda: 1,
      }),
    ).toBe(true);
  });

  it("does not flag cheap stocks with healthy fundamentals", () => {
    expect(
      isPossibleValueTrap({
        upsidePct: 0.3,
        revenueGrowth: 0.1,
        fcf: 10,
        debtToEbitda: 1,
      }),
    ).toBe(false);
  });

  it("does not flag stocks that are not cheap regardless of fundamentals", () => {
    expect(
      isPossibleValueTrap({
        upsidePct: 0.05,
        revenueGrowth: -0.2,
        fcf: -10,
        debtToEbitda: 8,
      }),
    ).toBe(false);
  });
});
