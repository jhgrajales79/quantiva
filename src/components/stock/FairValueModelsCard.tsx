"use client";

import { useEffect, useState } from "react";
import { FairValueModels } from "@/components/cards/FairValueModels";
import { Card, CardHeader } from "@/components/ui/Card";
import { Spinner } from "@/components/ui/Spinner";

interface ModelResult {
  model: string;
  fairValue: number | null;
  assumptions: Record<string, unknown>;
  unavailableReason: string | null;
}

export function FairValueModelsCard({ symbol }: { symbol: string }) {
  const [models, setModels] = useState<ModelResult[] | null>(null);

  useEffect(() => {
    fetch(`/api/valuation/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setModels(data?.models ?? null))
      .catch(() => setModels(null));
  }, [symbol]);

  if (models === null) {
    return (
      <Card>
        <CardHeader title="Modelos de valoración" />
        <Spinner />
      </Card>
    );
  }

  return <FairValueModels models={models} />;
}
