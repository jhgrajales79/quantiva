"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Portfolio {
  id: string;
  name: string;
  baseCurrency: string;
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
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-app-fg">Mis Portafolios</h1>

      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Portafolio largo plazo"
          className="w-64 rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-sm text-app-fg outline-none focus:border-emerald-500"
        />
        <button
          type="submit"
          className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
        >
          Crear portafolio
        </button>
      </form>

      {!portfolios ? (
        <p className="text-sm text-app-fg-muted">Cargando...</p>
      ) : portfolios.length === 0 ? (
        <p className="text-sm text-app-fg-muted">Aún no tienes portafolios. Crea el primero arriba.</p>
      ) : (
        <ul className="divide-y divide-app-border rounded-lg border border-app-border bg-app-surface">
          {portfolios.map((p) => (
            <li key={p.id}>
              <Link href={`/portfolio/${p.id}`} className="flex items-center justify-between p-3 hover:bg-app-surface-2/50">
                <span className="text-sm font-medium text-app-fg">{p.name}</span>
                <span className="text-xs text-app-fg-muted">{p.baseCurrency}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
