import { describe, expect, it } from "vitest";
import { computeHistoricalComparison } from "../historical-comparison";

describe("computeHistoricalComparison", () => {
  it("marks unavailable with a reason when current value is missing", () => {
    const result = computeHistoricalComparison(null, [10, 12, 14]);
    expect(result.unavailable).toBe(true);
    expect(result.reason).toContain("Dato no disponible");
  });

  it("marks unavailable with 'historial insuficiente' when fewer than 2 samples", () => {
    const result = computeHistoricalComparison(20, [10]);
    expect(result.unavailable).toBe(true);
    expect(result.reason).toContain("insuficiente");
    expect(result.sampleCount).toBe(1);
  });

  it("ignores null entries when counting samples", () => {
    const result = computeHistoricalComparison(20, [10, null, 14, null]);
    expect(result.sampleCount).toBe(2);
    expect(result.average).toBeCloseTo(12, 6);
  });

  it("computes vsAveragePct correctly when enough samples exist", () => {
    const result = computeHistoricalComparison(24, [20, 20]);
    expect(result.unavailable).toBe(false);
    expect(result.average).toBeCloseTo(20, 6);
    expect(result.vsAveragePct).toBeCloseTo(0.2, 6);
  });
});
