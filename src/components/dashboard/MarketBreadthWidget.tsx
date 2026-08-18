"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatPercent } from "@/lib/format";

interface BreadthData {
  advancing: number;
  declining: number;
  pctAboveMa50: number;
  pctAboveMa200: number;
  newHighs52w: number;
  newLows52w: number;
  universeSize: number;
}

export function MarketBreadthWidget() {
  const [data, setData] = useState<BreadthData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/market-breadth")
      .then(async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error ?? "Dato no disponible");
        }
        return res.json();
      })
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Card>
      <CardHeader title={`Amplitud del mercado · S&P 500${data ? ` (${data.universeSize})` : ""}`} />
      {error ? (
        <p className="text-sm text-neutral-500">Dato no disponible: {error}</p>
      ) : !data ? (
        <p className="text-sm text-neutral-500">Cargando...</p>
      ) : (
        <>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="font-semibold text-emerald-400">{data.advancing} suben</span>
            <span className="font-semibold text-red-400">{data.declining} bajan</span>
          </div>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-neutral-800">
            <div
              className="bg-emerald-500"
              style={{ width: `${(data.advancing / (data.advancing + data.declining || 1)) * 100}%` }}
            />
            <div
              className="bg-red-500"
              style={{ width: `${(data.declining / (data.advancing + data.declining || 1)) * 100}%` }}
            />
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
            <Stat label="Sobre MM50" value={formatPercent(data.pctAboveMa50, 1)} tone="success" />
            <Stat label="Sobre MM200" value={formatPercent(data.pctAboveMa200, 1)} tone="success" />
            <Stat label="Máx. 52s" value={String(data.newHighs52w)} tone="success" />
            <Stat label="Mín. 52s" value={String(data.newLows52w)} tone="danger" />
          </div>
        </>
      )}
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone: "success" | "danger" }) {
  return (
    <div>
      <p className={tone === "success" ? "text-lg font-semibold text-emerald-400" : "text-lg font-semibold text-red-400"}>
        {value}
      </p>
      <p className="text-xs text-neutral-500">{label}</p>
    </div>
  );
}
