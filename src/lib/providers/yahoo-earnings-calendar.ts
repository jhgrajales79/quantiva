import { z } from "zod";
import { yahooFetchPublic } from "./yahoo-http";

const earningsRecordSchema = z.object({
  ticker: z.string(),
  companyShortName: z.string().optional(),
  dateIsEstimate: z.boolean().optional().default(false),
  startDateTime: z.number(),
  startDateTimeType: z.string().optional().default(""),
  fiscalYear: z.string().optional(),
  quarter: z.string().optional(),
  epsActual: z.number().nullable().optional(),
  epsEstimate: z.number().nullable().optional(),
  surprisePercent: z.number().nullable().optional(),
  gmtOffsetMilliSeconds: z.number().optional().default(0),
});

const dayBucketSchema = z.object({
  timestampString: z.string(),
  totalCount: z.number(),
  records: z.array(earningsRecordSchema),
});

const calendarResponseSchema = z.object({
  finance: z.object({
    result: z.object({
      earnings: z.array(dayBucketSchema).optional(),
    }),
  }),
});

export type EarningsTiming = "bmo" | "amc" | "unknown";

export interface EarningsCalendarEvent {
  symbol: string;
  companyName: string;
  reportTimeIso: string;
  reportDateBucket: string;
  dateIsEstimate: boolean;
  fiscalYear: string | null;
  quarter: string | null;
  epsActual: number | null;
  epsEstimate: number | null;
  surprisePercent: number | null;
  timing: EarningsTiming;
}

const COUNT_PER_DAY = 100;

// La fuente marca la hora confirmada de tres formas: "BMO"/"AMC" explícitos
// (poco frecuentes, solo cuando la empresa ya publicó su horario oficial),
// "TAS" (asignado retroactivamente una vez que el reporte ya salió, junto
// con el actual), o vacío/"TNS" para reportes futuros cuya fecha es todavía
// una estimación sin hora confirmada — esos se muestran como "Hora por
// confirmar" en vez de inventar un horario.
function classifyTiming(startDateTime: number, gmtOffsetMs: number, rawType: string): EarningsTiming {
  const type = rawType.toUpperCase();
  if (type === "BMO") return "bmo";
  if (type === "AMC") return "amc";
  if (type !== "TAS") return "unknown";

  const localMinutes =
    new Date(startDateTime + gmtOffsetMs).getUTCHours() * 60 +
    new Date(startDateTime + gmtOffsetMs).getUTCMinutes();
  if (localMinutes < 9 * 60 + 30) return "bmo";
  if (localMinutes >= 16 * 60) return "amc";
  return "unknown";
}

/**
 * Calendario de resultados (earnings) real vía el mismo endpoint público de
 * Yahoo Finance usado para el calendario económico, con `modules=earnings`.
 * La fuente no expone ingresos actual/estimado (solo EPS) — el consumidor
 * debe mostrar "Dato no disponible" para Ingresos en vez de inventarlo.
 */
export async function getEarningsCalendar(from: Date, to: Date): Promise<EarningsCalendarEvent[]> {
  const url =
    `https://query1.finance.yahoo.com/ws/screeners/v1/finance/calendar-events` +
    `?countPerDay=${COUNT_PER_DAY}&startDate=${from.getTime()}&endDate=${to.getTime()}` +
    `&modules=earnings&lang=en-US&region=US`;

  const data = await yahooFetchPublic(url, calendarResponseSchema);
  const buckets = data.finance.result.earnings ?? [];

  const events: EarningsCalendarEvent[] = [];
  for (const day of buckets) {
    for (const r of day.records) {
      // Los tickers con sufijo de punto (.KS, .HK, .SS, .MX, .BA, etc.) cotizan
      // en su moneda local, no en USD — se excluyen para no mostrar un precio
      // en dólares que en realidad está en otra moneda. Los ADR de empresas
      // extranjeras que cotizan en bolsas de EE.UU. (BABA, NTES, BHP...) no
      // llevan sufijo y sí quedan incluidos.
      if (r.ticker.includes(".")) continue;

      events.push({
        symbol: r.ticker,
        companyName: r.companyShortName ?? r.ticker,
        reportTimeIso: new Date(r.startDateTime).toISOString(),
        reportDateBucket: day.timestampString,
        dateIsEstimate: r.dateIsEstimate,
        fiscalYear: r.fiscalYear ?? null,
        quarter: r.quarter ?? null,
        epsActual: r.epsActual ?? null,
        epsEstimate: r.epsEstimate ?? null,
        surprisePercent: r.surprisePercent ?? null,
        timing: classifyTiming(r.startDateTime, r.gmtOffsetMilliSeconds, r.startDateTimeType),
      });
    }
  }

  // La fuente a veces repite el mismo ticker+horario en más de un bucket
  // (revisión de fecha estimada); se conserva solo una entrada por par.
  const dedupedByKey = new Map<string, EarningsCalendarEvent>();
  for (const e of events) dedupedByKey.set(`${e.symbol}-${e.reportTimeIso}`, e);
  const deduped = [...dedupedByKey.values()];

  deduped.sort((a, b) => a.reportTimeIso.localeCompare(b.reportTimeIso));
  return deduped;
}
