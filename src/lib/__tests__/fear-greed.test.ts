import { describe, expect, it } from "vitest";
import { translateFearGreedRating } from "../fear-greed";

describe("translateFearGreedRating", () => {
  it("translates known CNN ratings to Spanish", () => {
    expect(translateFearGreedRating("neutral")).toBe("Neutral");
    expect(translateFearGreedRating("extreme fear")).toBe("Miedo extremo");
    expect(translateFearGreedRating("Greed")).toBe("Codicia");
  });

  it("falls back to the raw value for unknown ratings instead of guessing", () => {
    expect(translateFearGreedRating("something-new")).toBe("something-new");
  });
});
