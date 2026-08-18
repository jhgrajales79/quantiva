import { describe, expect, it } from "vitest";
import { valueGraham } from "../graham";

describe("valueGraham", () => {
  it("computes sqrt(22.5 * EPS * BVPS)", () => {
    const result = valueGraham(5, 20);
    expect(result.fairValue).toBeCloseTo(Math.sqrt(22.5 * 5 * 20), 6);
    expect(result.unavailableReason).toBeNull();
  });

  it("returns unavailable when EPS is negative", () => {
    const result = valueGraham(-1, 20);
    expect(result.fairValue).toBeNull();
    expect(result.unavailableReason).not.toBeNull();
  });

  it("returns unavailable when book value per share is missing", () => {
    const result = valueGraham(5, null);
    expect(result.fairValue).toBeNull();
    expect(result.unavailableReason).toContain("Dato no disponible");
  });
});
