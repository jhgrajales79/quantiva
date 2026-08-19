"use client";

import Link from "next/link";
import { formatCompact, formatPercent } from "@/lib/format";

interface MoverRow {
  symbol: string;
  name: string;
  changePct: number | null;
  volume: number | null;
}

export function MoversTable({ title, rows }: { title: string; rows: MoverRow[] }) {
  return (
    <div className="rounded-lg border border-app-border bg-app-surface">
      <h3 className="border-b border-app-border p-3 text-sm font-semibold text-app-fg">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-app-fg-muted">Dato no disponible.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol} className="border-b border-app-border last:border-0 hover:bg-app-surface-2/40">
                <td className="px-3 py-2">
                  <Link href={`/stocks/${row.symbol}`} className="font-medium hover:underline">
                    {row.symbol}
                  </Link>
                  <span className="ml-1 text-xs text-app-fg-muted">{row.name}</span>
                </td>
                <td
                  className={`px-3 py-2 text-right ${
                    row.changePct === null
                      ? "text-app-fg-muted"
                      : row.changePct >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                  }`}
                >
                  {formatPercent(row.changePct ? row.changePct / 100 : null)}
                </td>
                <td className="px-3 py-2 text-right text-app-fg-muted">
                  {formatCompact(row.volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
