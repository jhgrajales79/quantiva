import { z } from "zod";
import { yahooFetchWithCrumb } from "./yahoo-http";

const nullableNumber = z.union([z.number(), z.null()]).catch(null);

const batchQuoteItemSchema = z.object({
  symbol: z.string(),
  regularMarketChangePercent: nullableNumber,
  fiftyDayAverage: nullableNumber,
  twoHundredDayAverage: nullableNumber,
  regularMarketPrice: nullableNumber,
  fiftyTwoWeekHigh: nullableNumber,
  fiftyTwoWeekLow: nullableNumber,
});

const batchQuoteResponseSchema = z.object({
  quoteResponse: z.object({
    result: z.array(batchQuoteItemSchema),
  }),
});

export type BatchQuoteItem = z.infer<typeof batchQuoteItemSchema>;

const CHUNK_SIZE = 150;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

/**
 * Consulta v7/finance/quote en lotes de ~150 símbolos (para no exceder
 * límites de longitud de URL), en paralelo. Usado para amplitud de mercado,
 * donde se necesitan ~500 quotes de un solo golpe en vez de 500 requests
 * individuales.
 */
export async function batchGetQuotes(symbols: string[]): Promise<BatchQuoteItem[]> {
  const chunks = chunk(symbols, CHUNK_SIZE);

  const results = await Promise.all(
    chunks.map((batch) =>
      yahooFetchWithCrumb(
        (crumb) =>
          `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${batch.join(",")}&crumb=${encodeURIComponent(crumb)}`,
        batchQuoteResponseSchema,
      ),
    ),
  );

  return results.flatMap((r) => r.quoteResponse.result);
}
