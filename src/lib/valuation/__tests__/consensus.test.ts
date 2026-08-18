import { describe, expect, it } from "vitest";
import { computeConsensus, valuationBadge } from "../consensus";
import type { ValuationResult } from "../types";

function ok(model: ValuationResult["model"], fairValue: number): ValuationResult {
  return { model, fairValue, assumptions: {}, unavailableReason: null };
}

function unavailable(model: ValuationResult["model"]): ValuationResult {
  return { model, fairValue: null, assumptions: {}, unavailableReason: "Dato no disponible." };
}

describe("computeConsensus", () => {
  it("renormalizes weights over only the available models", () => {
    const results = [ok("dcf", 100), ok("graham", 80), unavailable("pe_relative"), unavailable("ev_ebitda"), unavailable("ps")];
    const consensus = computeConsensus(results, 90);

    expect(consensus.modelsUsed).toHaveLength(2);
    const totalWeight = consensus.modelsUsed.reduce((sum, m) => sum + m.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 6);
    expect(consensus.modelsUnavailable).toHaveLength(3);
    expect(consensus.fairValueConsensus).not.toBeNull();
  });

  it("returns null consensus when no model is available", () => {
    const consensus = computeConsensus(
      [unavailable("dcf"), unavailable("graham")],
      100,
    );
    expect(consensus.fairValueConsensus).toBeNull();
    expect(consensus.upsidePct).toBeNull();
  });

  it("computes upside and margin of safety price from consensus and current price", () => {
    const consensus = computeConsensus([ok("dcf", 120)], 100, 0.2);
    expect(consensus.upsidePct).toBeCloseTo(0.2, 6);
    expect(consensus.marginOfSafetyPrice).toBeCloseTo(96, 6);
  });
});

describe("valuationBadge", () => {
  it("classifies upside into badges", () => {
    expect(valuationBadge(0.5)).toBe("great_discount");
    expect(valuationBadge(0.2)).toBe("discount");
    expect(valuationBadge(0)).toBe("fair_price");
    expect(valuationBadge(-0.2)).toBe("overvalued");
    expect(valuationBadge(-0.5)).toBe("very_overvalued");
    expect(valuationBadge(null)).toBeNull();
  });
});
