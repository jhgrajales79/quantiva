import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { macroIndicators } from "@/lib/db/schema";
import { getMacroDataProvider } from "@/lib/providers/registry";
import { MACRO_SERIES } from "@/lib/providers/macro-series";
import { newId } from "@/lib/id";

async function getLatestTwo(code: string) {
  return db
    .select()
    .from(macroIndicators)
    .where(eq(macroIndicators.code, code))
    .orderBy(desc(macroIndicators.date))
    .limit(2);
}

export async function GET() {
  const results = [];

  for (const series of MACRO_SERIES) {
    let [latest, previous] = await getLatestTwo(series.code);

    // Refresca si no hay dato o el más reciente tiene más de 3 días (los
    // indicadores oficiales no cambian más seguido que eso; evita llamar a
    // FRED en cada request).
    const staleThresholdMs = 3 * 24 * 60 * 60_000;
    const isStale =
      !latest || Date.now() - latest.fetchedAt.getTime() > staleThresholdMs;

    if (isStale) {
      try {
        const provider = getMacroDataProvider();
        const points = await provider.getSeries(series.code);
        const fetchedAt = new Date();

        for (const point of points) {
          await db
            .insert(macroIndicators)
            .values({
              id: newId("macro"),
              code: series.code,
              date: point.date,
              value: point.value,
              previousValue: null,
              source: provider.name,
              fetchedAt,
            })
            .onConflictDoUpdate({
              target: [macroIndicators.code, macroIndicators.date],
              set: { value: point.value, fetchedAt },
            });
        }

        [latest, previous] = await getLatestTwo(series.code);
      } catch (error) {
        // si falla el refresh, se sirve lo que ya hubiera en cache (puede
        // ser null si nunca se logró obtener este indicador)
        void error;
      }
    }

    results.push({
      code: series.code,
      label: series.label,
      unit: series.unit,
      value: latest?.value ?? null,
      previousValue: previous?.value ?? null,
      date: latest?.date ?? null,
      source: latest?.source ?? null,
      fetchedAt: latest?.fetchedAt?.toISOString() ?? null,
      unavailable: !latest,
    });
  }

  return NextResponse.json({ indicators: results });
}
