import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { macroIndicators } from "@/lib/db/schema";
import { getMacroDataProvider } from "@/lib/providers/registry";
import { MACRO_SERIES } from "@/lib/providers/macro-series";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { newId } from "@/lib/id";

export async function GET(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const provider = getMacroDataProvider();
  let updated = 0;
  const errors: string[] = [];

  for (const series of MACRO_SERIES) {
    try {
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
      updated += 1;
    } catch (error) {
      errors.push(`${series.code}: ${(error as Error).message}`);
    }
  }

  return NextResponse.json({ updated, total: MACRO_SERIES.length, errors });
}
