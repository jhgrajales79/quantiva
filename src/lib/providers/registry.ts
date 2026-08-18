import { FmpProvider } from "./fmp-provider";
import { FredProvider } from "./fred-provider";
import { CoinGeckoProvider } from "./coingecko-provider";
import type { CryptoDataProvider, MacroDataProvider, MarketDataProvider } from "./types";

// Central place that decides which provider implementation backs each data
// domain. Reading from env vars for now; in Fase 3 (Admin Portal → API
// Management, §45.3 del plan) this can be swapped to read from the database
// without changing any calling code, since everything depends on the
// interfaces in ./types, not on these concrete classes.
let marketDataProvider: MarketDataProvider | null = null;
let macroDataProvider: MacroDataProvider | null = null;
let cryptoDataProvider: CryptoDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (!marketDataProvider) {
    marketDataProvider = new FmpProvider();
  }
  return marketDataProvider;
}

export function getMacroDataProvider(): MacroDataProvider {
  if (!macroDataProvider) {
    macroDataProvider = new FredProvider();
  }
  return macroDataProvider;
}

export function getCryptoDataProvider(): CryptoDataProvider {
  if (!cryptoDataProvider) {
    cryptoDataProvider = new CoinGeckoProvider();
  }
  return cryptoDataProvider;
}
