"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { QuoteStatGrid } from "./QuoteStatGrid";
import { CryptoStatGrid } from "./CryptoStatGrid";
import { FavoritesStatGrid } from "./FavoritesStatGrid";
import { US_SYMBOLS, GLOBAL_SYMBOLS, COMMODITY_SYMBOLS, FX_PAIRS } from "@/lib/market-symbols";

const TABS = [
  { key: "us", label: "Índices" },
  { key: "global", label: "Global" },
  { key: "crypto", label: "Cripto" },
  { key: "commodities", label: "Materias primas" },
  { key: "fx", label: "Divisas" },
  { key: "favorites", label: "Mis favoritos" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function MarketMonitorWidget() {
  const [tab, setTab] = useState<TabKey>("us");

  return (
    <Card>
      <CardHeader
        title="Mercado"
        action={<span className="text-xs text-app-fg-muted">clic en una tarjeta para cambiar el activo · actualizado recién</span>}
      />
      <div className="mb-3 flex flex-wrap gap-1 border-b border-app-border pb-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
              tab === t.key
                ? "bg-app-surface-2 text-app-fg"
                : "text-app-fg-muted hover:text-app-fg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "us" && <QuoteStatGrid symbols={US_SYMBOLS} />}
      {tab === "global" && <QuoteStatGrid symbols={GLOBAL_SYMBOLS} />}
      {tab === "crypto" && <CryptoStatGrid />}
      {tab === "commodities" && <QuoteStatGrid symbols={COMMODITY_SYMBOLS} />}
      {tab === "fx" && <QuoteStatGrid symbols={FX_PAIRS} />}
      {tab === "favorites" && <FavoritesStatGrid />}
    </Card>
  );
}
