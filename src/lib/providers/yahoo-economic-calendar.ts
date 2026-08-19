import { z } from "zod";
import { yahooFetchPublic } from "./yahoo-http";

const eventRecordSchema = z.object({
  event: z.string(),
  countryCode: z.string(),
  eventTime: z.number(),
  period: z.string().optional(),
  prior: z.string().optional(),
  actual: z.string().optional(),
  revisedFrom: z.string().optional(),
  description: z.string().optional(),
});

const dayBucketSchema = z.object({
  timestampString: z.string(),
  timezone: z.string(),
  totalCount: z.number(),
  records: z.array(eventRecordSchema),
});

const calendarResponseSchema = z.object({
  finance: z.object({
    result: z.object({
      economicEvents: z.array(dayBucketSchema).optional(),
    }),
  }),
});

export interface EconomicEvent {
  event: string;
  countryCode: string;
  eventTimeIso: string;
  period: string | null;
  prior: string | null;
  actual: string | null;
  revisedFrom: string | null;
  description: string | null;
  highImportance: boolean;
}

const COUNT_PER_DAY = 100;

async function fetchDayBuckets(fromMs: number, toMs: number, highImportanceOnly: boolean) {
  const url =
    `https://query1.finance.yahoo.com/ws/screeners/v1/finance/calendar-events` +
    `?countPerDay=${COUNT_PER_DAY}&economicEventsHighImportanceOnly=${highImportanceOnly}` +
    `&economicEventsRegionFilter=&startDate=${fromMs}&endDate=${toMs}` +
    `&modules=economicEvents&lang=en-US&region=US`;

  const data = await yahooFetchPublic(url, calendarResponseSchema);
  return data.finance.result.economicEvents ?? [];
}

function recordKey(r: z.infer<typeof eventRecordSchema>) {
  return `${r.event}|${r.countryCode}|${r.eventTime}`;
}

/**
 * Calendario económico real vía el endpoint público (sin auth) de Yahoo
 * Finance. La fuente no expone un campo de consenso/estimado de mercado —
 * solo valor previo y, una vez publicado, el valor real. Yahoo sí distingue
 * internamente "alta importancia" vs el resto (parámetro
 * economicEventsHighImportanceOnly), así que se hacen dos consultas para
 * poder marcar qué eventos son de alto impacto, sin inventar una escala de
 * 3 niveles que la fuente no tiene.
 */
export async function getEconomicCalendar(from: Date, to: Date): Promise<EconomicEvent[]> {
  const fromMs = from.getTime();
  const toMs = to.getTime();

  const [allBuckets, highBuckets] = await Promise.all([
    fetchDayBuckets(fromMs, toMs, false),
    fetchDayBuckets(fromMs, toMs, true),
  ]);

  const highKeys = new Set(
    highBuckets.flatMap((day) => day.records.map((r) => recordKey(r))),
  );

  const events: EconomicEvent[] = [];
  for (const day of allBuckets) {
    for (const r of day.records) {
      events.push({
        event: r.event,
        countryCode: r.countryCode,
        eventTimeIso: new Date(r.eventTime).toISOString(),
        period: r.period ?? null,
        prior: r.prior ?? null,
        actual: r.actual ?? null,
        revisedFrom: r.revisedFrom ?? null,
        description: r.description ?? null,
        highImportance: highKeys.has(recordKey(r)),
      });
    }
  }

  events.sort((a, b) => a.eventTimeIso.localeCompare(b.eventTimeIso));
  return events;
}
