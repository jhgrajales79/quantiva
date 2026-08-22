"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Thead, Th, Tbody, Tr, Td, TableEmpty } from "@/components/ui/Table";
import { SkeletonTableRows } from "@/components/ui/Skeleton";
import { formatCurrency, formatPercent } from "@/lib/format";

interface HistoryQuarter {
  quarterEndDate: string | null;
  epsActual: number | null;
  epsEstimate: number | null;
  epsDifference: number | null;
  surprisePercent: number | null;
}

export function EarningsHistoryCard({ symbol }: { symbol: string }) {
  const [history, setHistory] = useState<HistoryQuarter[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
    fetch(`/api/earnings-history/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setHistory(data?.history ?? null))
      .catch(() => setHistory(null))
      .finally(() => setLoaded(true));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Earnings" subtitle="BPA real vs. estimado, últimos trimestres reportados" />
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <Thead>
            <Th>Trimestre</Th>
            <Th align="right">Real</Th>
            <Th align="right">Estimado</Th>
            <Th align="right">Sorpresa</Th>
          </Thead>
          <Tbody>
            {!loaded ? (
              <SkeletonTableRows rows={4} cols={4} />
            ) : !history || history.length === 0 ? (
              <TableEmpty colSpan={4}>Dato no disponible</TableEmpty>
            ) : (
              history.map((q) => (
                <Tr key={q.quarterEndDate}>
                  <Td className="text-app-fg-muted">{q.quarterEndDate ?? "—"}</Td>
                  <Td align="right" className="text-app-fg">
                    {formatCurrency(q.epsActual)}
                  </Td>
                  <Td align="right" className="text-app-fg-muted">
                    {formatCurrency(q.epsEstimate)}
                  </Td>
                  <Td
                    align="right"
                    className={`font-medium ${
                      q.surprisePercent === null
                        ? "text-app-fg-faint"
                        : q.surprisePercent >= 0
                          ? "text-positive"
                          : "text-negative"
                    }`}
                  >
                    {q.surprisePercent !== null
                      ? `${q.surprisePercent >= 0 ? "+" : ""}${formatPercent(q.surprisePercent)}`
                      : "—"}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </table>
      </div>
    </Card>
  );
}
