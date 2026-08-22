"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import { AllocationBar } from "@/components/portfolio/AllocationBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";

interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
  allocation: { symbol: string; weightPct: number | null }[];
}

export default function PortfolioListPage() {
  const [portfolios, setPortfolios] = useState<Portfolio[] | null>(null);
  const [name, setName] = useState("");

  async function load() {
    const res = await fetch("/api/portfolio");
    const data = await res.json();
    setPortfolios(data.portfolios ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    setName("");
    load();
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Mis Portafolios"
        icon={Briefcase}
        description="Gestiona tus portafolios de inversión y da seguimiento a tus posiciones."
      />

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Portafolio largo plazo"
          className="w-64 rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-sm text-app-fg outline-none focus:border-brand"
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Crear portafolio
        </button>
      </form>

      {!portfolios ? (
        <div className="space-y-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i}>
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="mt-3 h-2 w-full rounded-pill" />
            </Card>
          ))}
        </div>
      ) : portfolios.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          message="Aún no tienes portafolios. Crea el primero arriba."
        />
      ) : (
        <div className="space-y-3">
          {portfolios.map((p) => (
            <Link key={p.id} href={`/portfolio/${p.id}`} className="block">
              <Card className="transition-colors hover:bg-app-surface-2/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-app-fg">{p.name}</span>
                  <span className="text-xs text-app-fg-muted">{p.baseCurrency}</span>
                </div>
                <div className="mt-2">
                  <AllocationBar allocation={p.allocation} />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
