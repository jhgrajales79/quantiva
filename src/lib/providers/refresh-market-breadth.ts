import { db } from "@/lib/db/client";
import { marketBreadthSnapshots } from "@/lib/db/schema";
import { SP500_CONSTITUENTS } from "@/lib/providers/sp500-constituents";
import { batchGetQuotes } from "@/lib/providers/yahoo-batch-quote";
import { aggregateBreadth } from "@/lib/market-breadth";

const SOURCE = "Yahoo Finance (S&P 500 constituents snapshot)";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Recalcula la amplitud de mercado consultando los ~500 constituyentes del
 * S&P 500 en lote y persiste el snapshot del día. Compartido entre la ruta
 * on-demand (`/api/market-breadth`) y el cron diario para no duplicar la
 * lógica de agregación ni el manejo de errores.
 */
export async function refreshMarketBreadth() {
  const quotes = await batchGetQuotes(SP500_CONSTITUENTS);
  const aggregate = aggregateBreadth(quotes);
  const date = today();
  const fetchedAt = new Date();

  await db
    .insert(marketBreadthSnapshots)
    .values({
      date,
      advancing: aggregate.advancing,
      declining: aggregate.declining,
      pctAboveMa50: aggregate.pctAboveMa50,
      pctAboveMa200: aggregate.pctAboveMa200,
      newHighs52w: aggregate.newHighs52w,
      newLows52w: aggregate.newLows52w,
      universeSize: aggregate.universeSize,
      source: SOURCE,
      fetchedAt,
    })
    .onConflictDoUpdate({
      target: marketBreadthSnapshots.date,
      set: {
        advancing: aggregate.advancing,
        declining: aggregate.declining,
        pctAboveMa50: aggregate.pctAboveMa50,
        pctAboveMa200: aggregate.pctAboveMa200,
        newHighs52w: aggregate.newHighs52w,
        newLows52w: aggregate.newLows52w,
        universeSize: aggregate.universeSize,
        fetchedAt,
      },
    });

  return { date, ...aggregate, source: SOURCE, fetchedAt };
}
