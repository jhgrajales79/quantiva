"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Spinner } from "@/components/ui/Spinner";

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
        <Spinner />
      ) : peers.length === 0 ? (
        <p className="text-sm text-app-fg-muted">Dato no disponible.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {peers.map((p) => (
            <Link
              key={p.symbol}
              href={`/stocks/${p.symbol}`}
              className="rounded-md border border-app-border p-3 transition hover:border-app-border"
            >
              <p className="text-sm font-medium text-app-fg">{p.symbol}</p>
              <p className="text-sm text-app-fg-muted">{formatCurrency(p.price)}</p>
              <p className={p.changePct !== null && p.changePct >= 0 ? "text-xs tabular-nums text-positive" : "text-xs tabular-nums text-negative"}>
                {formatPercent(p.changePct === null ? null : p.changePct / 100)}
              </p>
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}
