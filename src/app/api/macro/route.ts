import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { macroIndicators } from "@/lib/db/schema";
import { getMacroDataProvider } from "@/lib/providers/registry";
import { MACRO_SERIES } from "@/lib/providers/macro-series";
import { newId } from "@/lib/id";

const HISTORY_LIMIT = 15; // suficiente para YoY mensual (12) y trimestral (4)
const STALE_THRESHOLD_MS = 3 * 24 * 60 * 60_000; // los indicadores oficiales no cambian más seguido que esto

async function getHistoryDesc(code: string) {
  return db
    .select()
    .from(macroIndicators)
    .where(eq(macroIndicators.code, code))
    .orderBy(desc(macroIndicators.date))
    .limit(HISTORY_LIMIT);
}

async function fetchIndicator(series: (typeof MACRO_SERIES)[number]) {
  let history = await getHistoryDesc(series.code);

  const isStale =
    history.length === 0 || Date.now() - history[0].fetchedAt.getTime() > STALE_THRESHOLD_MS;

  if (isStale) {
    try {
      const provider = getMacroDataProvider();
      const points = await provider.getSeries(series.code);
      const fetchedAt = new Date();

      if (points.length > 0) {
        await db
          .insert(macroIndicators)
          .values(
            points.map((point) => ({
              id: newId("macro"),
              code: series.code,
              date: point.date,
              value: point.value,
              previousValue: null,
              source: provider.name,
              fetchedAt,
            })),
          )
          .onConflictDoUpdate({
            target: [macroIndicators.code, macroIndicators.date],
            set: { value: sql`excluded.value`, fetchedAt: sql`excluded.fetched_at` },
          });
      }

      history = await getHistoryDesc(series.code);
    } catch {
      // si falla el refresh, se sirve lo que ya hubiera en cache (puede ser
      // vacío si nunca se logró obtener este indicador)
    }
  }

  const [latest, previous] = history;

  return {
    code: series.code,
    label: series.label,
    unit: series.unit,
    value: latest?.value ?? null,
    previousValue: previous?.value ?? null,
    date: latest?.date ?? null,
    source: latest?.source ?? null,
    fetchedAt: latest?.fetchedAt?.toISOString() ?? null,
    unavailable: !latest,
    // ascendente por fecha, listo para un sparkline
    history: [...history].reverse().map((h) => ({ date: h.date, value: h.value })),
  };
}

export async function GET() {
  const results = await Promise.all(MACRO_SERIES.map(fetchIndicator));
  return NextResponse.json({ indicators: results });
}
