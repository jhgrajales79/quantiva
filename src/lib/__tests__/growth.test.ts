import { describe, expect, it } from "vitest";
import { computeCagrFromHistory } from "../growth";

describe("computeCagrFromHistory", () => {
  it("returns null with fewer than 2 samples", () => {
    const result = computeCagrFromHistory([{ fiscalDate: "2026-01-01", value: 100 }]);
    expect(result.cagr).toBeNull();
    expect(result.sampleCount).toBe(1);
  });

  it("computes CAGR using the real year span between first and last sample", () => {
    const result = computeCagrFromHistory([
      { fiscalDate: "2024-01-01", value: 100 },
      { fiscalDate: "2026-01-01", value: 121 },
    ]);
    expect(result.yearsSpan).toBeCloseTo(2, 1);
    expect(result.cagr).toBeCloseTo(0.1, 1);
  });

  it("ignores null entries", () => {
    const result = computeCagrFromHistory([
      { fiscalDate: "2024-01-01", value: 100 },
      { fiscalDate: "2025-01-01", value: null },
      { fiscalDate: "2026-01-01", value: 144 },
    ]);
    expect(result.sampleCount).toBe(2);
    expect(result.cagr).toBeCloseTo(0.2, 1);
  });
});
