"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { countryName } from "@/lib/country-names";
import { Spinner } from "@/components/ui/Spinner";
import { Badge } from "@/components/ui/Badge";
import { Thead, Th, Tbody, Tr, Td } from "@/components/ui/Table";

interface EconomicEvent {
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

type RangePreset = "today" | "tomorrow" | "week" | "nextWeek";

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

function rangeFor(preset: RangePreset, now: Date): { from: Date; to: Date } {
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
}

const ET_TZ = "America/New_York";

function formatDate(d: Date): string {
  return d.toLocaleDateString("es-ES", { day: "2-digit", month: "short", timeZone: ET_TZ });
}

function etDayKey(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: ET_TZ });
}

function formatDayHeader(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: ET_TZ,
  });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/New_York",
  });
}

function downloadCsv(events: EconomicEvent[]) {
  const header = ["Fecha", "Hora (ET)", "Impacto", "País", "Evento", "Actual", "Anterior"];
  const rows = events.map((e) => [
    etDayKey(e.eventTimeIso),
    formatTime(e.eventTimeIso),
    e.highImportance ? "Alto" : "Normal",
    countryName(e.countryCode),
    e.event,
    e.actual ?? "",
    e.prior ?? "",
  ]);
  const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "calendario-economico.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function EconomicCalendar() {
  const [preset, setPreset] = useState<RangePreset>("today");
  const [events, setEvents] = useState<EconomicEvent[] | null>(null);
  const [impact, setImpact] = useState<"all" | "high">("all");
  const [country, setCountry] = useState<string>("");
  const [query, setQuery] = useState("");
  const [note, setNote] = useState<string | null>(null);

  const { from, to } = useMemo(() => rangeFor(preset, new Date()), [preset]);

  useEffect(() => {
    setEvents(null);
    fetch(`/api/economic-calendar?from=${from.toISOString()}&to=${to.toISOString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setEvents(data?.events ?? []);
        setNote(data?.note ?? null);
      })
      .catch(() => setEvents([]));
  }, [from, to]);

  const countries = useMemo(() => {
    const set = new Set((events ?? []).map((e) => e.countryCode));
    return [...set].sort((a, b) => countryName(a).localeCompare(countryName(b)));
  }, [events]);

  const filtered = useMemo(() => {
    let list = events ?? [];
    if (impact === "high") list = list.filter((e) => e.highImportance);
    if (country) list = list.filter((e) => e.countryCode === country);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (e) => e.event.toLowerCase().includes(q) || countryName(e.countryCode).toLowerCase().includes(q),
      );
    }
    return list;
  }, [events, impact, country, query]);

  const highCount = filtered.filter((e) => e.highImportance).length;
  const normalCount = filtered.length - highCount;

  const nextHighImpact = filtered
    .filter((e) => e.highImportance && new Date(e.eventTimeIso).getTime() >= Date.now())
    .sort((a, b) => a.eventTimeIso.localeCompare(b.eventTimeIso))[0];

  const published = filtered
    .filter((e) => e.actual !== null)
    .sort((a, b) => b.eventTimeIso.localeCompare(a.eventTimeIso))
    .slice(0, 2);

  const grouped = useMemo(() => {
    const map = new Map<string, EconomicEvent[]>();
    for (const e of filtered) {
      const day = etDayKey(e.eventTimeIso);
      if (!map.has(day)) map.set(day, []);
      map.get(day)!.push(e);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <div className="space-y-4">
        <Card>
          <p className="text-xs font-medium text-app-fg-muted">Próximo evento clave</p>
          {nextHighImpact ? (
            <>
              <p className="mt-1 text-sm font-semibold text-app-fg">{nextHighImpact.event}</p>
              <p className="text-xs text-app-fg-muted">
                {countryName(nextHighImpact.countryCode)} · {formatDate(new Date(nextHighImpact.eventTimeIso))}{" "}
                {formatTime(nextHighImpact.eventTimeIso)} ET
              </p>
            </>
          ) : (
            <p className="mt-1 text-sm text-app-fg-muted">
              No queda ninguno de alto impacto por publicarse en este rango.
            </p>
          )}
        </Card>

        <Card>
          <p className="text-xs font-medium text-app-fg-muted">En el rango</p>
          <div className="mt-2 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-app-fg">Alto impacto</span>
              <span className="text-app-fg-muted">{highCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-app-fg">Normal</span>
              <span className="text-app-fg-muted">{normalCount}</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-app-fg-faint">
            Clasificación de impacto según Yahoo Finance (no existen los niveles "medio/bajo" en la
            fuente, solo alto vs. el resto).
          </p>
        </Card>

        <Card>
          <CardHeader title="Filtros" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Evento o país..."
            className="w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg"
          />

          <p className="mt-4 text-xs font-medium text-app-fg-muted">Rango de fechas</p>
          <div className="mt-1 grid grid-cols-2 gap-1.5">
            {(
              [
                ["today", "Hoy"],
                ["tomorrow", "Mañana"],
                ["week", "Esta semana"],
                ["nextWeek", "Próxima semana"],
              ] as [RangePreset, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPreset(value)}
                className={`rounded-card border px-2 py-1.5 text-xs ${
                  preset === value
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-app-border text-app-fg-muted hover:bg-app-surface-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-medium text-app-fg-muted">Impacto</p>
          <div className="mt-1 flex gap-1.5">
            {(
              [
                ["all", "Todos"],
                ["high", "Alto"],
              ] as [typeof impact, string][]
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setImpact(value)}
                className={`rounded-card border px-2 py-1.5 text-xs ${
                  impact === value
                    ? "border-brand bg-brand/10 text-brand"
                    : "border-app-border text-app-fg-muted hover:bg-app-surface-2"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <p className="mt-4 text-xs font-medium text-app-fg-muted">País</p>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="mt-1 w-full rounded-md border border-app-border bg-app-bg px-2 py-1.5 text-sm text-app-fg"
          >
            <option value="">Todos</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {countryName(c)}
              </option>
            ))}
          </select>

          <p className="mt-4 text-xs font-medium text-app-fg-muted">Zona horaria</p>
          <p className="mt-1 text-xs text-app-fg-faint">
            Hora del Este de EE.UU. (America/New_York), según la fuente.
          </p>

          <div className="mt-4 flex items-center justify-between border-t border-app-border pt-3">
            <p className="text-xs text-app-fg-muted">
              Mostrando {filtered.length} de {events?.length ?? 0}
            </p>
            <button
              onClick={() => downloadCsv(filtered)}
              disabled={filtered.length === 0}
              className="text-xs font-medium text-brand hover:underline disabled:opacity-40"
            >
              Exportar CSV
            </button>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <Card>
          <CardHeader title="Ya publicados" subtitle="lo que salió y cómo quedó vs. el valor anterior" />
          {published.length === 0 ? (
            <p className="text-sm text-app-fg-muted">
              Ningún evento de este rango tiene un valor real publicado todavía.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {published.map((e) => {
                const actualNum = e.actual !== null ? Number(e.actual) : null;
                const priorNum = e.prior !== null ? Number(e.prior) : null;
                const delta =
                  actualNum !== null && priorNum !== null && !Number.isNaN(actualNum) && !Number.isNaN(priorNum)
                    ? actualNum - priorNum
                    : null;
                return (
                  <div
                    key={`${e.countryCode}-${e.event}-${e.eventTimeIso}`}
                    className="rounded-card border border-app-border bg-app-surface-2 p-3"
                  >
                    <p className="text-xs text-app-fg-muted">
                      {e.event} {e.period ? `(${e.period})` : ""}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-xl font-semibold tabular-nums text-app-fg">{e.actual}</span>
                      {delta !== null && (
                        <Badge variant={delta >= 0 ? "success" : "danger"} className="tabular-nums">
                          {delta >= 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(2)} vs. anterior
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-app-fg-muted">
                      {countryName(e.countryCode)} · anterior {e.prior ?? "Dato no disponible"}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card padded={false}>
          <div className="p-4">
            <CardHeader
              title="Agenda"
              subtitle={`${filtered.length} eventos · horas en hora del Este`}
            />
            {note && <p className="text-xs text-app-fg-faint">{note}</p>}
          </div>
          {events === null ? (
            <Spinner className="p-4" />
          ) : grouped.length === 0 ? (
            <p className="p-4 text-sm text-app-fg-muted">Sin eventos para estos filtros.</p>
          ) : (
            grouped.map(([day, dayEvents]) => (
              <div key={day}>
                <p className="border-b border-app-border bg-app-surface-2 px-4 py-1.5 text-xs font-medium text-app-fg-muted">
                  {formatDayHeader(dayEvents[0].eventTimeIso)} · {dayEvents.length} eventos
                </p>
                <table className="w-full text-sm">
                  <Thead>
                    <Th>Hora</Th>
                    <Th>Imp.</Th>
                    <Th>País</Th>
                    <Th>Evento</Th>
                    <Th align="right">Actual</Th>
                    <Th align="right">Estimado</Th>
                    <Th align="right">Anterior</Th>
                  </Thead>
                  <Tbody>
                    {dayEvents.map((e) => (
                      <Tr key={`${e.countryCode}-${e.event}-${e.eventTimeIso}`}>
                        <Td className="text-app-fg-muted">{formatTime(e.eventTimeIso)}</Td>
                        <Td>
                          {e.highImportance ? (
                            <Badge variant="danger">Alto</Badge>
                          ) : (
                            <Badge variant="neutral">Normal</Badge>
                          )}
                        </Td>
                        <Td className="text-app-fg-muted">{e.countryCode}</Td>
                        <Td className="text-app-fg">
                          {e.event} {e.period ? <span className="text-app-fg-muted">({e.period})</span> : null}
                        </Td>
                        <Td align="right" className="text-app-fg">{e.actual ?? "—"}</Td>
                        <Td align="right" className="text-app-fg-faint">Dato no disponible</Td>
                        <Td align="right" className="text-app-fg-muted">{e.prior ?? "—"}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </table>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
