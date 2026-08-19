"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";
import { formatCompact, formatPercent } from "@/lib/format";

interface ShareholdersResponse {
  insidersPct: number | null;
  institutionsPct: number | null;
  institutionsCount: number | null;
  topHolders: { organization: string; pctHeld: number | null; position: number | null; value: number | null }[];
}

export function ShareholdersCard({ symbol }: { symbol: string }) {
  const [data, setData] = useState<ShareholdersResponse | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/shareholders/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoaded(true));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Accionistas" subtitle="Institucionales vs. insiders, vía Yahoo Finance" />
      {!loaded ? (
        <Spinner />
      ) : !data ? (
        <p className="text-sm text-app-fg-muted">Dato no disponible</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md bg-app-surface-2 p-2">
              <p className="text-lg font-semibold text-app-fg">{formatPercent(data.institutionsPct)}</p>
              <p className="text-xs text-app-fg-muted">Institucionales</p>
            </div>
            <div className="rounded-md bg-app-surface-2 p-2">
              <p className="text-lg font-semibold text-app-fg">{formatPercent(data.insidersPct)}</p>
              <p className="text-xs text-app-fg-muted">Insiders</p>
            </div>
            <div className="rounded-md bg-app-surface-2 p-2">
              <p className="text-lg font-semibold text-app-fg">
                {data.institutionsCount !== null ? data.institutionsCount.toLocaleString("es-CO") : "—"}
              </p>
              <p className="text-xs text-app-fg-muted">Nº instituciones</p>
            </div>
          </div>

          {data.topHolders.length === 0 ? (
            <p className="mt-3 text-sm text-app-fg-muted">Dato no disponible: sin desglose de tenedores.</p>
          ) : (
            <ul className="mt-3 divide-y divide-app-border">
              {data.topHolders.map((h) => (
                <li key={h.organization} className="flex items-center justify-between py-1.5 text-sm">
                  <span className="text-app-fg">{h.organization}</span>
                  <span className="flex gap-3 text-app-fg-muted">
                    <span>{formatPercent(h.pctHeld)}</span>
                    <span className="w-16 text-right">{formatCompact(h.value)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Card>
  );
}
