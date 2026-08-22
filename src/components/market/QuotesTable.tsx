"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Table, Thead, Th, Tbody, Tr, Td, TableEmpty } from "@/components/ui/Table";
import { Spinner } from "@/components/ui/Spinner";

interface ExtendedHoursQuote {
  label: string;
  price: number;
}

interface QuoteRow {
  symbol: string;
  label: string;
  price: number | null;
  changePct: number | null;
  extendedHours: ExtendedHoursQuote | null;
  error?: string;
}

export function QuotesTable({ symbols }: { symbols: { symbol: string; label: string }[] }) {
  const [rows, setRows] = useState<QuoteRow[] | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all(
      symbols.map(async ({ symbol, label }) => {
        try {
          const res = await fetch(`/api/quotes/${symbol}`);
          if (!res.ok) {
            const body = await res.json().catch(() => ({}));
            return {
              symbol,
              label,
              price: null,
              changePct: null,
              extendedHours: null,
              error: body.error ?? "Dato no disponible",
            };
          }
          const data = await res.json();
          return {
            symbol,
            label,
            price: data.price,
            changePct: data.changePct,
            extendedHours: data.extendedHours ?? null,
          };
        } catch {
          return {
            symbol,
            label,
            price: null,
            changePct: null,
            extendedHours: null,
            error: "Dato no disponible",
          };
        }
      }),
    ).then((results) => {
      if (mounted) setRows(results);
    });
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(symbols)]);

  if (!rows) {
    return <Spinner label="Cargando cotizaciones..." className="p-4" />;
  }

  return (
    <Table>
      <Thead>
        <Th>Instrumento</Th>
        <Th align="right">Precio</Th>
        <Th align="right">Var.</Th>
      </Thead>
      <Tbody>
        {rows.length === 0 ? (
          <TableEmpty colSpan={3}>Dato no disponible.</TableEmpty>
        ) : (
          rows.map((row) => (
            <Tr key={row.symbol}>
              <Td>
                <Link href={`/stocks/${row.symbol}`} className="font-medium hover:underline">
                  {row.label}
                </Link>
                <span className="ml-1 text-xs text-app-fg-muted">{row.symbol}</span>
              </Td>
              <Td align="right">
                {row.error ? (
                  <span className="text-xs text-app-fg-muted">Dato no disponible</span>
                ) : (
                  <>
                    {formatCurrency(row.price)}
                    {row.extendedHours && (
                      <div className="text-xs tabular-nums text-info">
                        {row.extendedHours.label} {formatCurrency(row.extendedHours.price)}
                      </div>
                    )}
                  </>
                )}
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
                {formatPercent(row.changePct === null ? null : row.changePct / 100)}
              </Td>
            </Tr>
          ))
        )}
      </Tbody>
    </Table>
  );
}
