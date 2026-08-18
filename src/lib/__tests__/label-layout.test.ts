import { describe, expect, it } from "vitest";
import { assignLabelRows } from "../label-layout";

function countViolations(positions: number[], rows: number[], minGapPct: number): number {
  let violations = 0;
  for (let row = 0; row <= Math.max(...rows); row++) {
    const inRow = positions.filter((_, i) => rows[i] === row);
    for (let i = 1; i < inRow.length; i++) {
      if (inRow[i] - inRow[i - 1] < minGapPct) violations += 1;
    }
  }
  return violations;
}

function violatesMinGap(positions: number[], rows: number[], minGapPct: number): boolean {
  return countViolations(positions, rows, minGapPct) > 0;
}

describe("assignLabelRows", () => {
  it("returns one row index per input position, all within range", () => {
    const positions = [0, 30, 60, 90];
    const rows = assignLabelRows(positions, 2, 10);
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r >= 0 && r < 2)).toBe(true);
  });

  it("never puts two same-row labels closer than minGap when it's satisfiable with enough rows", () => {
    const positions = [0, 20, 40, 60, 80, 100];
    const rows = assignLabelRows(positions, 3, 15);
    expect(violatesMinGap(positions, rows, 15)).toBe(false);
  });

  it("spreads a tight cluster across more rows to reduce (not necessarily eliminate) collisions", () => {
    const positions = [0, 8.9, 17.3, 23.6, 32.3, 35.2, 36.8, 39.8];
    const twoRowViolations = countViolations(positions, assignLabelRows(positions, 2, 8), 8);
    const fourRowViolations = countViolations(positions, assignLabelRows(positions, 4, 8), 8);
    expect(fourRowViolations).toBeLessThan(twoRowViolations);
  });

  it("does not throw and still returns valid rows when points are too clustered to satisfy the gap", () => {
    const positions = [10, 10.5, 11, 11.5];
    const rows = assignLabelRows(positions, 2, 50);
    expect(rows).toHaveLength(4);
    expect(rows.every((r) => r === 0 || r === 1)).toBe(true);
  });
});
