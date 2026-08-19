"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { MiniSparkline } from "./MiniSparkline";
import { computeYoyChange } from "@/lib/macro-yoy";
import { Spinner } from "@/components/ui/Spinner";

interface MacroIndicator {
  code: string;
  label: string;
  unit: string;
  value: number | null;
  previousValue: number | null;
  date: string | null;
  unavailable: boolean;
  history: { date: string; value: number | null }[];
}

// Series mostradas en la tira macro del dashboard, igual a la imagen:
// Inflación, PIB real, Desempleo, Tasa de la Fed.
const STRIP_CODES: Record<string, { label: string; yoyPeriods?: number }> = {
  CPIAUCSL: { label: "Inflación", yoyPeriods: 12 },
  GDPC1: { label: "PIB real (anual)", yoyPeriods: 4 },
  UNRATE: { label: "Desempleo" },
  FEDFUNDS: { label: "Tasa de la Fed (objetivo)" },
};

export function MacroStrip() {
  const [indicators, setIndicators] = useState<MacroIndicator[] | null>(null);

  useEffect(() => {
    fetch("/api/macro")
      .then((res) => res.json())
      .then((data) => setIndicators(data.indicators))
      .catch(() => setIndicators([]));
  }, []);

  const strip = indicators?.filter((i) => i.code in STRIP_CODES) ?? [];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {!indicators
        ? Object.values(STRIP_CODES).map((cfg) => (
            <Card key={cfg.label}>
              <p className="text-xs text-app-fg-muted">{cfg.label}</p>
              <Spinner className="mt-1" />
            </Card>
          ))
        : strip.map((ind) => {
            const config = STRIP_CODES[ind.code];
            const displayValue = config.yoyPeriods
              ? computeYoyChange(ind.history, config.yoyPeriods)
              : ind.value !== null
                ? ind.value / 100
                : null;

            const prevDisplayValue = config.yoyPeriods
              ? computeYoyChange(ind.history.slice(0, -1), config.yoyPeriods)
              : ind.previousValue !== null
                ? ind.previousValue / 100
                : null;

            const deltaPp =
              displayValue !== null && prevDisplayValue !== null
                ? (displayValue - prevDisplayValue) * 100
                : null;

            return (
              <Card key={ind.code}>
                <p className="text-xs text-app-fg-muted">{config.label}</p>
                <div className="mt-1 flex items-baseline gap-2">
                  <p className="text-lg font-semibold text-app-fg">
                    {displayValue === null ? "—" : `${(displayValue * 100).toFixed(1)}%`}
                  </p>
                  {deltaPp !== null && (
                    <span className={deltaPp >= 0 ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
                      {deltaPp >= 0 ? "+" : ""}
                      {deltaPp.toFixed(1)} pp
                    </span>
                  )}
                </div>
                <MiniSparkline
                  data={ind.history}
                  positive={deltaPp === null ? null : deltaPp >= 0}
                />
                <p className="text-xs text-app-fg-muted">
                  Último dato: {ind.date ?? "Dato no disponible"}
                </p>
              </Card>
            );
          })}
    </div>
  );
}
