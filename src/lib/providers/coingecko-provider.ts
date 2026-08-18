import { z } from "zod";
import type { CryptoDataProvider, CryptoQuote } from "./types";

const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

const nullableNumber = z.union([z.number(), z.null()]).catch(null);

const marketCoinSchema = z.object({
  id: z.string(),
  symbol: z.string(),
  name: z.string(),
  current_price: nullableNumber,
  market_cap: nullableNumber,
  total_volume: nullableNumber,
  price_change_percentage_24h: nullableNumber,
  circulating_supply: nullableNumber,
  max_supply: nullableNumber,
  ath: nullableNumber,
});

function toQuote(c: z.infer<typeof marketCoinSchema>): CryptoQuote {
  return {
    symbol: c.symbol.toUpperCase(),
    name: c.name,
    price: c.current_price ?? 0,
    marketCap: c.market_cap,
    volume24h: c.total_volume,
    change24hPct: c.price_change_percentage_24h,
    change7dPct: null,
    circulatingSupply: c.circulating_supply,
    maxSupply: c.max_supply,
    ath: c.ath,
  };
}

export class CoinGeckoProvider implements CryptoDataProvider {
  readonly name = "CoinGecko";

  async getTopByMarketCap(limit: number): Promise<CryptoQuote[]> {
    const url = new URL(`${COINGECKO_BASE_URL}/coins/markets`);
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("order", "market_cap_desc");
    url.searchParams.set("per_page", String(limit));
    url.searchParams.set("page", "1");

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      throw new Error(`CoinGecko request failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const parsed = z.array(marketCoinSchema).safeParse(json);
    if (!parsed.success) {
      throw new Error(`CoinGecko response validation failed: ${parsed.error.message}`);
    }

    return parsed.data.map(toQuote);
  }

  async getQuote(idOrSymbol: string): Promise<CryptoQuote | null> {
    const url = new URL(`${COINGECKO_BASE_URL}/coins/markets`);
    url.searchParams.set("vs_currency", "usd");
    url.searchParams.set("ids", idOrSymbol.toLowerCase());

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`CoinGecko request failed: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    const parsed = z.array(marketCoinSchema).safeParse(json);
    if (!parsed.success) {
      throw new Error(`CoinGecko response validation failed: ${parsed.error.message}`);
    }

    const coin = parsed.data[0];
    return coin ? toQuote(coin) : null;
  }
}
