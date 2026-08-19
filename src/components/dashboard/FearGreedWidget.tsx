"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface FearGreedData {
  score: number;
  rating: string;
  previousClose: number;
  previousWeek: number;
  date: string;
  source: string;
}

export function FearGreedWidget() {
  const [data, setData] = useState<FearGreedData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/fear-greed")
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
      <CardHeader
        title="Miedo y codicia"
        action={data && <Badge variant={badgeVariant(data.score)}>{data.rating}</Badge>}
      />
      {error ? (
        <p className="text-sm text-app-fg-muted">Dato no disponible: {error}</p>
      ) : !data ? (
        <p className="text-sm text-app-fg-muted">Cargando...</p>
      ) : (
        <>
          <p className="mb-1 text-3xl font-semibold text-app-fg">{Math.round(data.score)}/100</p>
          <div className="relative h-2 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 to-emerald-500">
            <div
              className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-app-border bg-neutral-100"
              style={{ left: `${data.score}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-xs text-app-fg-muted">
            <span>Miedo extremo</span>
            <span>Neutral</span>
            <span>Codicia extrema</span>
          </div>
          <p className="mt-3 text-xs text-app-fg-muted">
            hace 1 sem: {Math.round(data.previousWeek)} · cierre ant.: {Math.round(data.previousClose)} · fuente: {data.source}
          </p>
        </>
      )}
    </Card>
  );
}

function badgeVariant(score: number): "danger" | "warning" | "neutral" | "success" {
  if (score <= 20) return "danger";
  if (score <= 40) return "warning";
  if (score <= 60) return "neutral";
  if (score <= 80) return "success";
  return "success";
}
