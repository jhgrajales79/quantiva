"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatCompact, formatCurrency } from "@/lib/format";
import { Sunrise, Sunset, HelpCircle, Lock } from "lucide-react";

interface EarningsEvent {
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
  timing: "bmo" | "amc" | "unknown";
  price: number | null;
  changePct: number | null;
  marketCap: number | null;
}

type CapFilter = "all" | "2b" | "10b" | "100b";
type TimingFilter = "all" | "bmo" | "amc";

const CAP_THRESHOLDS: Record<CapFilter, number> = {
  all: 0,
  "2b": 2_000_000_000,
  "10b": 10_000_000_000,
  "100b": 100_000_000_000,
};

function startOfDay(d: Date): Date {
  const r = new Date(d);
  r.setHours(0, 0, 0, 0);
  return r;
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function formatDayHeader(bucket: string): string {
  return new Date(`${bucket}T12:00:00Z`).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function TimingIcon({ timing }: { timing: EarningsEvent["timing"] }) {
  if (timing === "bmo") return <Sunrise size={14} strokeWidth={2} className="text-amber-400" />;
  if (timing === "amc") return <Sunset size={14} strokeWidth={2} className="text-sky-400" />;
  return <HelpCircle size={14} strokeWidth={2} className="text-app-fg-faint" />;
}

function TimingLabel({ timing }: { timing: EarningsEvent["timing"] }) {
  const label = timing === "bmo" ? "Antes de la apertura" : timing === "amc" ? "Después del cierre" : "Hora por confirmar";
  return (
    <span className="flex items-center gap-1">
      <TimingIcon timing={timing} />
      {label}
    </span>
  );
}

export function EarningsCalendar() {
  const [events, setEvents] = useState<EarningsEvent[] | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [preset, setPreset] = useState<"today" | "tomorrow" | "week" | "nextWeek">("week");
  const [capFilter, setCapFilter] = useState<CapFilter>("all");
  const [timingFilter, setTimingFilter] = useState<TimingFilter>("all");

  useEffect(() => {
    const now = new Date();
    const from = addDays(startOfDay(now), -7);
    const to = addDays(startOfDay(now), 14);
    fetch(`/api/earnings-calendar/broad?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setEvents(data?.events ?? []);
        setNote(data?.note ?? null);
      })
      .catch(() => setEvents([]));
  }, []);

  const presetRange = useMemo(() => {
    const now = new Date();
    const today = startOfDay(now);
    switch (preset) {
      case "today":
        return { from: today, to: addDays(today, 1) };
      case "tomorrow":
        return { from: addDays(today, 1), to: addDays(today, 2) };
      case "week":
        return { from: today, to: addDays(today, 7) };
      case "nextWeek":
        return { from: addDays(today, 7), to: addDays(today, 14) };
    }
  }, [preset]);

  const upcoming = useMemo(() => {
    if (!events) return [];
    const now = Date.now();
    return events.filter((e) => new Date(e.reportTimeIso).getTime() >= now);
  }, [events]);

  const filtered = useMemo(() => {
    let list = upcoming.filter((e) => {
      const t = new Date(e.reportTimeIso).getTime();
      return t >= presetRange.from.getTime() && t < presetRange.to.getTime();
    });
    if (capFilter !== "all") {
      const min = CAP_THRESHOLDS[capFilter];
      list = list.filter((e) => e.marketCap !== null && e.marketCap >= min);
    }
    if (timingFilter !== "all") list = list.filter((e) => e.timing === timingFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((e) => e.symbol.toLowerCase().includes(q) || e.companyName.toLowerCase().includes(q));
    }
    return list;
  }, [upcoming, presetRange, capFilter, timingFilter, query]);

  const nextKeyReport = useMemo(() => {
    if (upcoming.length === 0) return undefined;
    const windowEnd = addDays(new Date(), 3).getTime();
    const nearTerm = upcoming.filter((e) => new Date(e.reportTimeIso).getTime() < windowEnd);
    const withCap = (nearTerm.length > 0 ? nearTerm : upcoming).filter((e) => e.marketCap !== null);
    if (withCap.length === 0) return upcoming[0];
    return withCap.sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))[0];
  }, [upcoming]);

  const topOfWeek = useMemo(() => {
    const weekEnd = addDays(startOfDay(new Date()), 7);
    return [...upcoming]
      .filter((e) => new Date(e.reportTimeIso).getTime() < weekEnd.getTime())
      .filter((e) => e.marketCap !== null)
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
      .slice(0, 10);
  }, [upcoming]);

  const alreadyReported = useMemo(() => {
    if (!events) return [];
    const sevenDaysAgo = addDays(new Date(), -7).getTime();
    return events
      .filter((e) => e.epsActual !== null && new Date(e.reportTimeIso).getTime() >= sevenDaysAgo)
      .sort((a, b) => (b.marketCap ?? 0) - (a.marketCap ?? 0))
      .slice(0, 4);
  }, [events]);

  const bmoCount = filtered.filter((e) => e.timing === "bmo").length;
  const amcCount = filtered.filter((e) => e.timing === "amc").length;
  const unknownCount = filtered.filter((e) => e.timing === "unknown").length;

  const grouped = useMemo(() => {
    const map = new Map<string, EarningsEvent[]>();
    for (const e of filtered) {
      if (!map.has(e.reportDateBucket)) map.set(e.reportDateBucket, []);
      map.get(e.reportDateBucket)!.push(e);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  if (events === null) {
    return <Spinner className="p-4" />;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <Card>
          <p className="text-xs font-medium text-app-fg-muted">Próximo reporte clave</p>
          {nextKeyReport ? (
            <>
              <p className="mt-1 text-sm font-semibold text-app-fg">
                {nextKeyReport.symbol}
                {nextKeyReport.marketCap !== null && (
                  <span className="ml-1 font-normal text-app-fg-muted">
                    {formatCompact(nextKeyReport.marketCap)} de capitalización
                  </span>
                )}
              </p>
              <p className="text-xs text-app-fg-muted">{nextKeyReport.companyName}</p>
              <div className="mt-2 inline-flex rounded-md bg-app-surface-2 px-2 py-1 text-xs text-app-fg">
                <TimingLabel timing={nextKeyReport.timing} />
              </div>
              <div>
                <Link
                  href={`/stocks/${nextKeyReport.symbol}`}
                  className="mt-3 inline-block rounded-md border border-app-border px-3 py-1.5 text-xs font-medium text-app-fg hover:bg-app-surface-2"
                >
                  Ver ficha de {nextKeyReport.symbol}
                </Link>
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-app-fg-muted">No hay reportes próximos en la ventana cargada.</p>
          )}
        </Card>

        {topOfWeek.length > 0 && (
          <Card>
            <p className="text-xs font-medium text-app-fg-muted">Los grandes de la semana</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {topOfWeek.map((e) => (
                <Link
                  key={e.symbol}
                  href={`/stocks/${e.symbol}`}
                  className="rounded-md border border-app-border px-2 py-1 text-center text-xs font-medium text-app-fg hover:bg-app-surface-2"
                >
                  {e.symbol}
                </Link>
              ))}
            </div>
          </Card>
        )}

        <Card>
          <p className="text-xs font-medium text-app-fg-muted">En el rango</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <TimingLabel timing="bmo" />
              <span className="text-app-fg-muted">{bmoCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <TimingLabel timing="amc" />
              <span className="text-app-fg-muted">{amcCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <TimingLabel timing="unknown" />
              <span className="text-app-fg-muted">{unknownCount}</span>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Filtros" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ticker o empresa..."
            className="w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg"
          />

          <p className="mt-4 text-xs font-medium text-app-fg-muted">Cuándo</p>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {(
              [
                ["today", "Hoy"],
                ["tomorrow", "Mañana"],
                ["week", "Esta semana"],
                ["nextWeek", "Próxima semana"],
              ] as [typeof preset, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPreset(value)}
                className={`rounded-md border px-2 py-1.5 text-xs ${
                  preset === value
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-app-border text-app-fg-muted hover:bg-app-surface-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-medium text-app-fg-muted">Capitalización</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(
              [
                ["all", "Todas"],
                ["2b", "≥ $2B"],
                ["10b", "≥ $10B"],
                ["100b", "≥ $100B"],
              ] as [CapFilter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setCapFilter(value)}
                className={`rounded-md border px-2 py-1.5 text-xs ${
                  capFilter === value
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-app-border text-app-fg-muted hover:bg-app-surface-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-medium text-app-fg-muted">Horario</p>
          <div className="mt-1 flex flex-wrap gap-1.5">
            {(
              [
                ["all", "Cualquier hora"],
                ["bmo", "Antes de abrir"],
                ["amc", "Tras el cierre"],
              ] as [TimingFilter, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setTimingFilter(value)}
                className={`rounded-md border px-2 py-1.5 text-xs ${
                  timingFilter === value
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-app-border text-app-fg-muted hover:bg-app-surface-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs text-app-fg-muted">Mostrando {filtered.length} reportes</p>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Ya reportaron" subtitle="las mayores de los últimos 7 días, con su sorpresa frente al consenso" />
          {alreadyReported.length === 0 ? (
            <p className="text-sm text-app-fg-muted">Ninguna de las últimas reportantes tiene datos suficientes todavía.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {alreadyReported.map((e) => (
                <Link
                  key={e.symbol}
                  href={`/stocks/${e.symbol}`}
                  className="rounded-lg border border-app-border bg-app-surface-2 p-3 hover:border-app-fg-faint"
                >
                  <p className="text-xs text-app-fg-muted">
                    {e.symbol} <span className="text-app-fg-faint">{e.companyName}</span>
                  </p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="text-lg font-semibold text-app-fg">{formatCurrency(e.price)}</span>
                    {e.changePct !== null && (
                      <span className={e.changePct >= 0 ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
                        {e.changePct >= 0 ? "+" : ""}
                        {e.changePct.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {e.surprisePercent !== null ? (
                    <span
                      className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        e.surprisePercent >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
                      }`}
                    >
                      BPA {e.surprisePercent >= 0 ? "+" : ""}
                      {e.surprisePercent.toFixed(1)}%
                    </span>
                  ) : (
                    <span className="mt-1 inline-block text-xs text-app-fg-faint">BPA: Dato no disponible</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="p-4">
            <CardHeader title="Reportes" subtitle={`${filtered.length} reportes · la sorpresa se colorea al publicarse`} />
            {note && <p className="text-xs text-app-fg-faint">{note}</p>}
          </div>
          {grouped.length === 0 ? (
            <p className="p-4 text-sm text-app-fg-muted">Sin reportes para estos filtros.</p>
          ) : (
            grouped.map(([day, dayEvents]) => (
              <div key={day}>
                <p className="border-b border-app-border bg-app-surface-2 px-4 py-1.5 text-xs font-medium text-app-fg-muted">
                  {formatDayHeader(day)} · {dayEvents.length} reportes
                </p>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-app-border text-left text-xs text-app-fg-muted">
                      <th className="px-4 py-2">Acción</th>
                      <th className="px-4 py-2 text-right">Precio</th>
                      <th className="px-4 py-2 text-right">Cap.</th>
                      <th className="px-4 py-2 text-right">BPA vs. Est.</th>
                      <th className="px-4 py-2 text-right">Ingresos vs. Est.</th>
                      <th className="px-4 py-2 text-right">Mov. esp.</th>
                      <th className="px-4 py-2 text-right">Valor justo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayEvents.map((e) => {
                      const surprise = e.surprisePercent;
                      return (
                        <tr
                          key={`${e.symbol}-${e.reportTimeIso}`}
                          className="border-b border-app-border last:border-0 hover:bg-app-surface-2"
                        >
                          <td className="px-4 py-2">
                            <Link href={`/stocks/${e.symbol}`} className="font-medium text-app-fg hover:underline">
                              {e.symbol}
                            </Link>
                            <span className="ml-2 text-app-fg-muted">{e.companyName}</span>
                            <span className="ml-2 inline-block align-middle">
                              <TimingIcon timing={e.timing} />
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right text-app-fg">{formatCurrency(e.price)}</td>
                          <td className="px-4 py-2 text-right text-app-fg-muted">{formatCompact(e.marketCap)}</td>
                          <td className="px-4 py-2 text-right">
                            {e.epsActual !== null ? (
                              <>
                                <span className="text-app-fg">{e.epsActual.toFixed(2)}</span>{" "}
                                {surprise !== null && (
                                  <span className={surprise >= 0 ? "text-emerald-400" : "text-red-400"}>
                                    {surprise >= 0 ? "+" : ""}
                                    {surprise.toFixed(1)}%
                                  </span>
                                )}
                              </>
                            ) : e.epsEstimate !== null ? (
                              <span className="text-app-fg-muted">est. {e.epsEstimate.toFixed(2)}</span>
                            ) : (
                              <span className="text-app-fg-faint">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-app-fg-faint">Dato no disponible</td>
                          <td className="px-4 py-2 text-right">
                            <Lock size={13} strokeWidth={2} className="ml-auto text-app-fg-faint" aria-label="Función PRO" />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Lock size={13} strokeWidth={2} className="ml-auto text-app-fg-faint" aria-label="Función PRO" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
