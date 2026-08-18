export function isStale(fetchedAt: Date | null | undefined, ttlMs: number): boolean {
  if (!fetchedAt) return true;
  return Date.now() - fetchedAt.getTime() > ttlMs;
}

export const TTL = {
  QUOTE_MS: 60_000, // 1 min en horario de mercado
  FUNDAMENTALS_MS: 24 * 60 * 60_000, // 24h
  NEWS_MS: 15 * 60_000, // 15 min
  MOVERS_MS: 5 * 60_000,
} as const;

export function isUsMarketOpen(now: Date = new Date()): "pre-market" | "open" | "after-hours" | "closed" {
  // Aproximación en hora de Nueva York (ET), sin manejar feriados de bolsa.
  const nyString = now.toLocaleString("en-US", { timeZone: "America/New_York" });
  const ny = new Date(nyString);
  const day = ny.getDay();
  if (day === 0 || day === 6) return "closed";

  const minutes = ny.getHours() * 60 + ny.getMinutes();
  const preMarketStart = 4 * 60;
  const marketOpen = 9 * 60 + 30;
  const marketClose = 16 * 60;
  const afterHoursEnd = 20 * 60;

  if (minutes >= marketOpen && minutes < marketClose) return "open";
  if (minutes >= preMarketStart && minutes < marketOpen) return "pre-market";
  if (minutes >= marketClose && minutes < afterHoursEnd) return "after-hours";
  return "closed";
}
