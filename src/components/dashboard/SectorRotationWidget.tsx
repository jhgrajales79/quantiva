"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatPercent } from "@/lib/format";
import { assignLabelRows } from "@/lib/label-layout";

type Period = "1d" | "1w" | "1m" | "ytd";

const PERIOD_TABS: { key: Period; label: string }[] = [
  { key: "1d", label: "Hoy" },
  { key: "1w", label: "1 sem." },
  { key: "1m", label: "1 mes" },
  { key: "ytd", label: "YTD" },
];

interface SectorResult {
  symbol: string;
  label: string;
  returns: Record<Period, number | null>;
  error: string | null;
}

export function SectorRotationWidget() {
  const [sectors, setSectors] = useState<SectorResult[] | null>(null);
  const [period, setPeriod] = useState<Period>("ytd");

  useEffect(() => {
    fetch("/api/sectors")
      .then((res) => res.json())
      .then((data) => setSectors(data.sectors))
      .catch(() => setSectors([]));
  }, []);

  return (
    <Card>
      <CardHeader
        title="Rotación sectorial · 11 sectores del S&P 500"
        action={
          <div className="flex gap-1">
            {PERIOD_TABS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-md px-2 py-1 text-xs font-medium ${
                  period === p.key
                    ? "bg-app-surface-2 text-app-fg"
                    : "text-app-fg-muted hover:text-app-fg-muted"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        }
      />
      <p className="mb-4 text-xs text-app-fg-muted">
        Dónde entra y sale el dinero. Cada punto es un sector.
      </p>

      {!sectors ? (
        <p className="text-sm text-app-fg-muted">Cargando...</p>
      ) : (
        <SectorAxis sectors={sectors} period={period} />
      )}

      <div className="mt-2 flex justify-between text-xs text-app-fg-muted">
        <span>← Más débil</span>
        <span>Más fuerte →</span>
      </div>
    </Card>
  );
}

function SectorAxis({ sectors, period }: { sectors: SectorResult[]; period: Period }) {
  const withValues = sectors
    .map((s) => ({ ...s, value: s.returns[period] }))
    .filter((s): s is SectorResult & { value: number } => s.value !== null)
    .sort((a, b) => a.value - b.value);

  if (withValues.length === 0) {
    return <p className="text-sm text-app-fg-muted">Dato no disponible.</p>;
  }

  const min = Math.min(...withValues.map((s) => s.value));
  const max = Math.max(...withValues.map((s) => s.value));
  const span = max - min || 1;

  const leftPcts = withValues.map((s) => ((s.value - min) / span) * 100);
  // 4 filas alternando arriba/abajo (2 por lado) — con 11 sectores es común
  // que varios queden con retornos muy cercanos entre sí; una asignación
  // greedy (no solo par/impar) evita que sus etiquetas se encimen.
  const ROW_OFFSETS = ["-top-14", "-top-9", "top-4", "top-9"];
  const rowIndexes = assignLabelRows(leftPcts, ROW_OFFSETS.length, 9);

  return (
    <div className="relative mt-14 mb-14 h-1.5 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500">
      {withValues.map((s, i) => (
        <div
          key={s.symbol}
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${leftPcts[i]}%` }}
        >
          <div
            className={`absolute left-1/2 w-max -translate-x-1/2 text-center ${ROW_OFFSETS[rowIndexes[i]]}`}
          >
            <p className="text-[11px] font-medium text-app-fg-muted">{s.label}</p>
            <p className={s.value >= 0 ? "text-[11px] text-emerald-400" : "text-[11px] text-red-400"}>
              {formatPercent(s.value)}
            </p>
          </div>
          <div className="h-2.5 w-2.5 rounded-full border-2 border-app-border bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}
