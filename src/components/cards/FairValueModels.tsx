"use client";

import { useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";

interface ModelResult {
  model: string;
  fairValue: number | null;
  assumptions: Record<string, unknown>;
  unavailableReason: string | null;
}

const MODEL_LABELS: Record<string, string> = {
  dcf: "DCF (Discounted Cash Flow)",
  pe_relative: "P/E Relativo",
  ev_ebitda: "EV/EBITDA Relativo",
  ps: "P/S (Price-to-Sales)",
  graham: "Graham Number",
};

export function FairValueModels({ models }: { models: ModelResult[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <Card padded={false}>
      <CardHeader
        title="Modelos de valoración"
        className="mb-0 border-b border-app-border px-4 py-3"
      />
      <ul className="divide-y divide-app-border">
        {models.map((m) => (
          <li key={m.model} className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-app-fg-muted">{MODEL_LABELS[m.model] ?? m.model}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium tabular-nums text-app-fg">
                  {m.fairValue !== null ? formatCurrency(m.fairValue) : "Dato no disponible"}
                </span>
                <button
                  onClick={() => setExpanded(expanded === m.model ? null : m.model)}
                  className="text-xs text-brand hover:underline"
                >
                  ¿Cómo se calculó?
                </button>
              </div>
            </div>
            {expanded === m.model && (
              <div className="mt-2 rounded-md bg-app-bg p-3 text-xs text-app-fg-muted">
                {m.unavailableReason ? (
                  <p>{m.unavailableReason}</p>
                ) : (
                  <pre className="whitespace-pre-wrap break-words">
                    {JSON.stringify(m.assumptions, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </Card>
  );
}
