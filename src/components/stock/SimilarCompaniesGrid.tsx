"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/format";

interface Peer {
  symbol: string;
  price: number | null;
  changePct: number | null;
}

export function SimilarCompaniesGrid({ symbol }: { symbol: string }) {
  const [peers, setPeers] = useState<Peer[] | null>(null);

  useEffect(() => {
    fetch(`/api/peers/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPeers(data?.peers ?? []))
      .catch(() => setPeers([]));
  }, [symbol]);

  return (
    <Card>
      <CardHeader title="Empresas similares" />
      {peers === null ? (
        <p className="text-sm text-neutral-500">Cargando...</p>
      ) : peers.length === 0 ? (
        <p className="text-sm text-neutral-500">Dato no disponible.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {peers.map((p) => (
            <Link
              key={p.symbol}
              href={`/stocks/${p.symbol}`}
              className="rounded-md border border-neutral-800 p-3 transition hover:border-neutral-700"
            >
              <p className="text-sm font-medium text-neutral-100">{p.symbol}</p>
              <p className="text-sm text-neutral-300">{formatCurrency(p.price)}</p>
              <p className={p.changePct !== null && p.changePct >= 0 ? "text-xs text-emerald-400" : "text-xs text-red-400"}>
                {formatPercent(p.changePct === null ? null : p.changePct / 100)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
