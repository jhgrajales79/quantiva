"use client";

import { useEffect, useState } from "react";

export interface ExtendedHoursQuote {
  label: string; // "Antes de la apertura" | "Tras el cierre"
  price: number;
  changePct: number | null; // ya viene como porcentaje entero (no fracción), ver formatPercent
}

export interface QuoteRow {
  symbol: string;
  label: string;
  price: number | null;
  changePct: number | null; // fracción (ya dividida entre 100), lista para formatPercent
  extendedHours: ExtendedHoursQuote | null;
  error?: string;
}

/**
 * Fetch en paralelo de /api/quotes/[symbol] para una lista de símbolos.
 * Compartido entre el Market Monitor del dashboard, la página /markets y
 * "Mis favoritos" — evita reimplementar el mismo fetch+normalización tres
 * veces.
 */
export function useQuotes(symbols: { symbol: string; label: string }[]): QuoteRow[] | null {
  const [rows, setRows] = useState<QuoteRow[] | null>(null);
  const key = symbols.map((s) => s.symbol).join(",");

  useEffect(() => {
    if (symbols.length === 0) {
      setRows([]);
      return;
    }
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
            changePct: data.changePct === null ? null : data.changePct / 100,
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
  }, [key]);

  return rows;
}
