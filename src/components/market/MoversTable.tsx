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
    <div className="rounded-lg border border-neutral-800 bg-neutral-900">
      <h3 className="border-b border-neutral-800 p-3 text-sm font-semibold text-neutral-200">
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="p-4 text-sm text-neutral-500">Dato no disponible.</p>
      ) : (
        <table className="w-full text-sm">
          <tbody>
            {rows.map((row) => (
              <tr key={row.symbol} className="border-b border-neutral-900 last:border-0 hover:bg-neutral-800/40">
                <td className="px-3 py-2">
                  <Link href={`/stocks/${row.symbol}`} className="font-medium hover:underline">
                    {row.symbol}
                  </Link>
                  <span className="ml-1 text-xs text-neutral-500">{row.name}</span>
                </td>
                <td
                  className={`px-3 py-2 text-right ${
                    row.changePct === null
                      ? "text-neutral-500"
                      : row.changePct >= 0
                        ? "text-emerald-400"
                        : "text-red-400"
                  }`}
                >
                  {formatPercent(row.changePct ? row.changePct / 100 : null)}
                </td>
                <td className="px-3 py-2 text-right text-neutral-400">
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
