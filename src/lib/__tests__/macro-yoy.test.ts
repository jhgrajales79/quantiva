import { describe, expect, it } from "vitest";
import { computeYoyChange } from "../macro-yoy";

function series(values: number[]): { date: string; value: number }[] {
  return values.map((value, i) => ({ date: `2020-${String(i + 1).padStart(2, "0")}-01`, value }));
}

describe("computeYoyChange", () => {
  it("returns null when there isn't enough history for the period", () => {
    expect(computeYoyChange(series([100, 101, 102]), 12)).toBeNull();
  });

  it("computes YoY change from 12 periods back for monthly series", () => {
    const values = Array.from({ length: 13 }, (_, i) => 100 + i); // 100..112
    expect(computeYoyChange(series(values), 12)).toBeCloseTo((112 - 100) / 100, 6);
  });

  it("computes YoY change from 4 periods back for quarterly series", () => {
    const values = [200, 205, 210, 215, 220];
    expect(computeYoyChange(series(values), 4)).toBeCloseTo((220 - 200) / 200, 6);
  });
});
