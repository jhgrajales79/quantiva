"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { ScoreGauge } from "@/components/cards/ScoreGauge";

interface ScoresResponse {
  scores: {
    value: number | null;
    quality: number | null;
    growth: number | null;
    momentum: number | null;
    investment: number | null;
  };
}

export function ScoresPanel({ symbol }: { symbol: string }) {
  const [data, setData] = useState<ScoresResponse | null>(null);

  useEffect(() => {
    fetch(`/api/valuation/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Puntajes de inversión" />
      <div className="flex flex-wrap items-center justify-center gap-6 pt-2">
        <ScoreGauge label="Investment Score" value={data?.scores.investment ?? null} size="lg" />
        <div className="flex flex-wrap justify-center gap-4">
          <ScoreGauge label="Valor" value={data?.scores.value ?? null} />
          <ScoreGauge label="Calidad" value={data?.scores.quality ?? null} />
          <ScoreGauge label="Crecimiento" value={data?.scores.growth ?? null} />
          <ScoreGauge label="Momentum" value={data?.scores.momentum ?? null} />
        </div>
      </div>
    </Card>
  );
}
