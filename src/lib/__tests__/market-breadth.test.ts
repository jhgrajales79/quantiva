import { describe, expect, it } from "vitest";
import { aggregateBreadth } from "../market-breadth";
import type { BatchQuoteItem } from "../providers/yahoo-batch-quote";

function quote(overrides: Partial<BatchQuoteItem>): BatchQuoteItem {
  return {
    symbol: "TEST",
    regularMarketChangePercent: null,
    fiftyDayAverage: null,
    twoHundredDayAverage: null,
    regularMarketPrice: null,
    fiftyTwoWeekHigh: null,
    fiftyTwoWeekLow: null,
    marketCap: null,
    netAssets: null,
    totalAssets: null,
    trailingPE: null,
    forwardPE: null,
    priceToBook: null,
    dividendYield: null,
    averageDailyVolume10Day: null,
    averageDailyVolume3Month: null,
    ...overrides,
  };
}

describe("aggregateBreadth", () => {
  it("counts advancing and declining only when changePercent is known", () => {
    const result = aggregateBreadth([
      quote({ regularMarketChangePercent: 1.5 }),
      quote({ regularMarketChangePercent: -2 }),
      quote({ regularMarketChangePercent: null }),
    ]);
    expect(result.advancing).toBe(1);
    expect(result.declining).toBe(1);
    expect(result.universeSize).toBe(3);
  });

  it("computes pct above MA50/MA200 only over stocks with both fields present", () => {
    const result = aggregateBreadth([
      quote({ regularMarketPrice: 110, fiftyDayAverage: 100, twoHundredDayAverage: 90 }),
      quote({ regularMarketPrice: 80, fiftyDayAverage: 100, twoHundredDayAverage: 90 }),
      quote({ regularMarketPrice: 50 }), // sin MA -> no cuenta en el denominador
    ]);
    expect(result.pctAboveMa50).toBeCloseTo(0.5, 6);
    expect(result.pctAboveMa200).toBeCloseTo(0.5, 6);
  });

  it("flags new 52-week highs/lows only when price touches the extreme", () => {
    const result = aggregateBreadth([
      quote({ regularMarketPrice: 100, fiftyTwoWeekHigh: 100, fiftyTwoWeekLow: 50 }),
      quote({ regularMarketPrice: 50, fiftyTwoWeekHigh: 120, fiftyTwoWeekLow: 50 }),
      quote({ regularMarketPrice: 70, fiftyTwoWeekHigh: 120, fiftyTwoWeekLow: 50 }),
    ]);
    expect(result.newHighs52w).toBe(1);
    expect(result.newLows52w).toBe(1);
  });

  it("returns zeroed percentages when no stock has MA data, instead of NaN", () => {
    const result = aggregateBreadth([quote({})]);
    expect(result.pctAboveMa50).toBe(0);
    expect(result.pctAboveMa200).toBe(0);
  });
});
