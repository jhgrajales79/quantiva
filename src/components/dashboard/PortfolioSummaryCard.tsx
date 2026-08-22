"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/Skeleton";
import { Briefcase } from "lucide-react";

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
    <Card className="flex h-full flex-col">
      <CardHeader
        title={`Mi portafolio${summary ? ` · ${count} carteras` : ""}`}
        action={<Badge variant="success">P&amp;L en vivo</Badge>}
      />
      {!summary ? (
        <div className="space-y-2">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      ) : count === 0 ? (
        <EmptyState
          icon={Briefcase}
          message="Aún no registras ninguna cartera. Crea una cartera y registra tus compras para seguir aquí tu patrimonio, tu ganancia y el peso de cada activo."
          ctaLabel="Ver mis portafolios"
          ctaHref="/portfolio"
        />
      ) : (
        <div className="flex flex-1 flex-col space-y-1">
          <p className="text-lg font-semibold text-app-fg">
            {formatCurrency(summary.totalCurrentValue)}
          </p>
          <p className={summary.totalUnrealizedPnl >= 0 ? "text-sm text-positive" : "text-sm text-negative"}>
            {formatCurrency(summary.totalUnrealizedPnl)} no realizado
          </p>
          <Link href="/portfolio" className="mt-auto inline-flex pt-2 text-sm text-brand hover:underline">
            Ver mis portafolios →
          </Link>
        </div>
      )}
    </Card>
  );
}
