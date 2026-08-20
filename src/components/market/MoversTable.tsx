"use client";

import Link from "next/link";
import { formatCompact, formatPercent } from "@/lib/format";
import { Card, CardHeader } from "@/components/ui/Card";
import { Tbody, Tr, Td } from "@/components/ui/Table";

interface MoverRow {
  symbol: string;
  name: string;
  changePct: number | null;
  volume: number | null;
}

export function MoversTable({ title, rows }: { title: string; rows: MoverRow[] }) {
  return (
    <Card padded={false}>
      <CardHeader title={title} className="mb-0 border-b border-app-border px-4 py-3" />
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-app-fg-muted">Dato no disponible.</p>
      ) : (
        <table className="w-full text-sm">
          <Tbody>
            {rows.map((row) => (
              <Tr key={row.symbol}>
                <Td>
                  <Link href={`/stocks/${row.symbol}`} className="font-medium hover:underline">
                    {row.symbol}
                  </Link>
                  <span className="ml-1 text-xs text-app-fg-muted">{row.name}</span>
                </Td>
                <Td
                  align="right"
                  className={
                    row.changePct === null
                      ? "text-app-fg-muted"
                      : row.changePct >= 0
                        ? "text-positive"
                        : "text-negative"
                  }
                >
                  {formatPercent(row.changePct ? row.changePct / 100 : null)}
                </Td>
                <Td align="right" className="text-app-fg-muted">
                  {formatCompact(row.volume)}
                </Td>
              </Tr>
            ))}
          </Tbody>
        </table>
      )}
    </Card>
  );
}
