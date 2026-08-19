import { z } from "zod";
import { yahooFetchWithCrumb } from "./yahoo-http";

const nullableNumber = z.union([z.number(), z.null()]).catch(null);

const extendedQuoteItemSchema = z.object({
  symbol: z.string(),
  marketState: z.string().nullable().optional().catch(null),
  regularMarketPrice: nullableNumber,
  regularMarketChange: nullableNumber,
  regularMarketChangePercent: nullableNumber,
  regularMarketPreviousClose: nullableNumber,
  preMarketPrice: nullableNumber,
  preMarketChange: nullableNumber,
  preMarketChangePercent: nullableNumber,
  postMarketPrice: nullableNumber,
  postMarketChange: nullableNumber,
  postMarketChangePercent: nullableNumber,
  marketCap: nullableNumber,
  totalCash: nullableNumber,
  totalDebt: nullableNumber,
});

const responseSchema = z.object({
  quoteResponse: z.object({ result: z.array(extendedQuoteItemSchema) }),
});

export type ExtendedQuote = z.infer<typeof extendedQuoteItemSchema>;

/**
 * Cotización con datos de pre/post-market (v7/finance/quote de un solo
 * símbolo) — usado en el encabezado de la ficha de acción para el precio
 * "antes de la apertura" / "tras el cierre", que el módulo de cotización
 * regular (v8/finance/chart) no expone.
 */
export async function getExtendedQuote(symbol: string): Promise<ExtendedQuote | null> {
  const data = await yahooFetchWithCrumb(
    (crumb) =>
      `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbol}&crumb=${encodeURIComponent(crumb)}`,
    responseSchema,
  );
  return data.quoteResponse.result[0] ?? null;
}
