import { YahooFinanceProvider } from "./yahoo-finance-provider";
import { FmpProvider } from "./fmp-provider";
import { FredProvider } from "./fred-provider";
import { CoinGeckoProvider } from "./coingecko-provider";
import type { CryptoDataProvider, MacroDataProvider, MarketDataProvider } from "./types";

// Yahoo Finance es el proveedor principal: no requiere API key y cubre
// precios, fundamentales, dividendos, ETFs, búsqueda, noticias y movers
// verificados directamente contra sus endpoints públicos.
//
// Yahoo solo expone el ratio TTM actual, no una serie histórica real por
// período (ver YahooFinanceProvider.getRatiosHistory) — por eso el
// histórico de ratios (P/E, EV/EBITDA, P/S relativos) usa FMP como fuente
// específica cuando hay FMP_API_KEY configurada, ya que su endpoint
// `/ratios?limit=N` sí devuelve un punto real por período fiscal.

// Central place that decides which provider implementation backs each data
// domain. Reading from env vars for now; in Fase 3 (Admin Portal → API
// Management, §45.3 del plan) this can be swapped to read from the database
// without changing any calling code, since everything depends on the
// interfaces in ./types, not on these concrete classes.
let marketDataProvider: MarketDataProvider | null = null;
let macroDataProvider: MacroDataProvider | null = null;
let cryptoDataProvider: CryptoDataProvider | null = null;
let ratiosHistoryProvider: MarketDataProvider | null = null;

export function getMarketDataProvider(): MarketDataProvider {
  if (!marketDataProvider) {
    marketDataProvider = new YahooFinanceProvider();
  }
  return marketDataProvider;
}

export function getRatiosHistoryProvider(): MarketDataProvider {
  if (!ratiosHistoryProvider) {
    ratiosHistoryProvider = process.env.FMP_API_KEY ? new FmpProvider() : getMarketDataProvider();
  }
  return ratiosHistoryProvider;
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
