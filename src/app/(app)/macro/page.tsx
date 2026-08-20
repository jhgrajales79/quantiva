"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Landmark } from "lucide-react";
import clsx from "clsx";

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
      <PageHeader
        icon={Landmark}
        title="Macro Dashboard"
        description="Fuente: Federal Reserve Economic Data (FRED). Se muestra la fecha de publicación oficial de cada indicador, no un timestamp de refresco artificial."
      />

      {!indicators ? (
        <Spinner />
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {indicators.map((ind) => {
            const change =
              ind.value !== null && ind.previousValue !== null
                ? ind.value - ind.previousValue
                : null;
            return (
              <Card key={ind.code}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-app-fg-muted">{ind.label}</h3>
                  <span className="text-xs text-app-fg-muted">{ind.unit}</span>
                </div>
                {ind.unavailable ? (
                  <p className="mt-2 text-sm text-app-fg-muted">Dato no disponible</p>
                ) : (
                  <>
                    <p className="mt-2 text-2xl font-semibold tabular-nums text-app-fg">
                      {ind.value?.toFixed(2)}
                    </p>
                    {change !== null && (
                      <p
                        className={clsx(
                          "text-sm tabular-nums",
                          change >= 0 ? "text-positive" : "text-negative",
                        )}
                      >
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
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
