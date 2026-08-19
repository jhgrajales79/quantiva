"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";

interface PortfolioSummary {
  totalPortfolios: number;
  totalCurrentValue: number;
  totalUnrealizedPnl: number;
}

export function PortfolioSummaryCard() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);

  useEffect(() => {
    fetch("/api/portfolio")
      .then((res) => res.json())
      .then((data) => setSummary(data.summary ?? null))
      .catch(() => setSummary(null));
  }, []);

  const count = summary?.totalPortfolios ?? 0;

  return (
    <Card>
      <CardHeader
        title={`Mi portafolio${summary ? ` · ${count} carteras` : ""}`}
        action={<Badge variant="success">P&amp;L en vivo</Badge>}
      />
      {!summary ? (
        <p className="text-sm text-app-fg-muted">Cargando...</p>
      ) : count === 0 ? (
        <EmptyState
          message="Aún no registras ninguna cartera. Crea una cartera y registra tus compras para seguir aquí tu patrimonio, tu ganancia y el peso de cada activo."
          ctaLabel="Ver mis portafolios"
          ctaHref="/portfolio"
        />
      ) : (
        <div className="space-y-1">
          <p className="text-lg font-semibold text-app-fg">
            {formatCurrency(summary.totalCurrentValue)}
          </p>
          <p className={summary.totalUnrealizedPnl >= 0 ? "text-sm text-emerald-400" : "text-sm text-red-400"}>
            {formatCurrency(summary.totalUnrealizedPnl)} no realizado
          </p>
          <Link href="/portfolio" className="inline-flex text-sm text-emerald-400 hover:underline">
            Ver mis portafolios →
          </Link>
        </div>
      )}
    </Card>
  );
}
