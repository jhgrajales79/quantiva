import { z } from "zod";

const FEAR_GREED_URL = "https://production.dataviz.cnn.io/index/fearandgreed/graphdata";

const responseSchema = z.object({
  fear_and_greed: z.object({
    score: z.number(),
    rating: z.string(),
    timestamp: z.string(),
    previous_close: z.number(),
    previous_1_week: z.number(),
  }),
});

export interface FearGreedSnapshot {
  score: number;
  rating: string;
  timestamp: string;
  previousClose: number;
  previousWeek: number;
}

/**
 * API no oficial de CNN Business (sin documentación pública, sin API key).
 * Requiere headers de navegador reales o responde 418 ("I'm a teapot.
 * You're a bot."). Verificado en vivo: score/rating/previous_close
 * coinciden con lo mostrado en cnn.com/markets/fear-and-greed.
 */
export async function fetchFearGreed(): Promise<FearGreedSnapshot> {
  const res = await fetch(FEAR_GREED_URL, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      Referer: "https://edition.cnn.com/markets/fear-and-greed",
      Origin: "https://edition.cnn.com",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Fear & Greed request failed: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  const parsed = responseSchema.parse(json);

  return {
    score: parsed.fear_and_greed.score,
    rating: parsed.fear_and_greed.rating,
    timestamp: parsed.fear_and_greed.timestamp,
    previousClose: parsed.fear_and_greed.previous_close,
    previousWeek: parsed.fear_and_greed.previous_1_week,
  };
}
