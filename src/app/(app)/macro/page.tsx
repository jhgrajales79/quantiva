"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

interface MacroIndicator {
  code: string;
  label: string;
  unit: string;
  value: number | null;
  previousValue: number | null;
  date: string | null;
  source: string | null;
  fetchedAt: string | null;
  unavailable: boolean;
}

export default function MacroPage() {
  const [indicators, setIndicators] = useState<MacroIndicator[] | null>(null);

  useEffect(() => {
    fetch("/api/macro")
      .then((res) => res.json())
      .then((data) => setIndicators(data.indicators));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-app-fg">Macro Dashboard</h1>
      <p className="text-sm text-app-fg-muted">
        Fuente: Federal Reserve Economic Data (FRED). Se muestra la fecha de publicación oficial
        de cada indicador, no un timestamp de refresco artificial.
      </p>

      {!indicators ? (
        <p className="text-sm text-app-fg-muted">Cargando...</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {indicators.map((ind) => {
            const change =
              ind.value !== null && ind.previousValue !== null
                ? ind.value - ind.previousValue
                : null;
            return (
              <div key={ind.code} className="rounded-lg border border-app-border bg-app-surface p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-app-fg-muted">{ind.label}</h3>
                  <span className="text-xs text-app-fg-muted">{ind.unit}</span>
                </div>
                {ind.unavailable ? (
                  <p className="mt-2 text-sm text-app-fg-muted">Dato no disponible</p>
                ) : (
                  <>
                    <p className="mt-2 text-2xl font-semibold text-app-fg">
                      {ind.value?.toFixed(2)}
                    </p>
                    {change !== null && (
                      <p className={change >= 0 ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
                        {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)} vs. anterior
                      </p>
                    )}
                    <p className="mt-1 text-xs text-app-fg-muted">
                      Fecha del dato: {ind.date} · Fuente: {ind.source}
                    </p>
                    <p className="text-xs text-app-fg-faint">
                      Actualizado: {formatDateTime(ind.fetchedAt)}
                    </p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
