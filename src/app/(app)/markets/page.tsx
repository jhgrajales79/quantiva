"use client";

import { useState } from "react";
import { QuotesTable } from "@/components/market/QuotesTable";
import { CryptoTable } from "@/components/market/CryptoTable";
import { US_SYMBOLS, GLOBAL_SYMBOLS, COMMODITY_SYMBOLS, FX_PAIRS } from "@/lib/market-symbols";
import { Globe } from "lucide-react";

const TABS = [
  { key: "us", label: "Estados Unidos" },
  { key: "global", label: "Global" },
  { key: "crypto", label: "Cripto" },
  { key: "commodities", label: "Commodities" },
  { key: "fx", label: "Divisas" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function MarketsPage() {
  const [tab, setTab] = useState<TabKey>("us");

  return (
    <div className="space-y-4">
      <h1 className="flex items-center gap-2 text-xl font-semibold text-app-fg">
        <Globe size={20} strokeWidth={2} />
        Mercados
      </h1>

      <div className="flex gap-1 border-b border-app-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm ${
              tab === t.key
                ? "border-b-2 border-emerald-500 text-app-fg"
                : "text-app-fg-muted hover:text-app-fg-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "us" && <QuotesTable symbols={US_SYMBOLS} />}
      {tab === "global" && <QuotesTable symbols={GLOBAL_SYMBOLS} />}
      {tab === "crypto" && <CryptoTable />}
      {tab === "commodities" && <QuotesTable symbols={COMMODITY_SYMBOLS} />}
      {tab === "fx" && <QuotesTable symbols={FX_PAIRS} />}

      <p className="text-xs text-app-fg-muted">
        Los índices, referencias globales y commodities se muestran mediante ETFs líquidos que
        los replican (no símbolos de índice directos), para evitar mostrar datos no confirmados
        por el proveedor.
      </p>
    </div>
  );
}
