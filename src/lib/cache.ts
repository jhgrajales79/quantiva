export function isStale(fetchedAt: Date | null | undefined, ttlMs: number): boolean {
  if (!fetchedAt) return true;
  return Date.now() - fetchedAt.getTime() > ttlMs;
}

export const TTL = {
  QUOTE_MS: 60_000, // 1 min en horario de mercado
  FUNDAMENTALS_MS: 24 * 60 * 60_000, // 24h
  NEWS_MS: 15 * 60_000, // 15 min
  MOVERS_MS: 5 * 60_000,
  FEAR_GREED_MS: 3 * 60 * 60_000, // 3h
  MARKET_BREADTH_MS: 6 * 60 * 60_000, // 6h
} as const;

export type MarketStatus = "pre-market" | "open" | "after-hours" | "closed";

export function isUsMarketOpen(now: Date = new Date()): MarketStatus {
  return getMarketStatusDetail(now).status;
}

export interface MarketStatusDetail {
  status: MarketStatus;
  /** Minutos hasta que termine la fase actual (null si no aplica, ej. cerrado). */
  minutesToNextTransition: number | null;
}

const PRE_MARKET_START = 4 * 60;
const MARKET_OPEN = 9 * 60 + 30;
const MARKET_CLOSE = 16 * 60;
const AFTER_HOURS_END = 20 * 60;

/**
 * Aproximación en hora de Nueva York (ET), sin manejar feriados de bolsa.
 * `minutesToNextTransition` es la base del "cierra en 3h 35m" de la imagen.
 */
export function getMarketStatusDetail(now: Date = new Date()): MarketStatusDetail {
  const nyString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const ny = new Date(nyString);
  const day = ny.getDay();

  if (day === 0 || day === 6) {
    return { status: "closed", minutesToNextTransition: null };
  }

  const minutes = ny.getHours() * 60 + ny.getMinutes();

  if (minutes >= MARKET_OPEN && minutes < MARKET_CLOSE) {
    return { status: "open", minutesToNextTransition: MARKET_CLOSE - minutes };
  }
  if (minutes >= PRE_MARKET_START && minutes < MARKET_OPEN) {
    return { status: "pre-market", minutesToNextTransition: MARKET_OPEN - minutes };
  }
  if (minutes >= MARKET_CLOSE && minutes < AFTER_HOURS_END) {
    return { status: "after-hours", minutesToNextTransition: AFTER_HOURS_END - minutes };
  }
  return { status: "closed", minutesToNextTransition: null };
}
