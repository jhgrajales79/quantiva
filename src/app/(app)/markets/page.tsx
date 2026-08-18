"use client";

import { useState } from "react";
import { QuotesTable } from "@/components/market/QuotesTable";
import { CryptoTable } from "@/components/market/CryptoTable";
import { US_SYMBOLS, GLOBAL_SYMBOLS, COMMODITY_SYMBOLS, FX_PAIRS } from "@/lib/market-symbols";

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
      <h1 className="text-xl font-semibold text-neutral-50">Mercados</h1>

      <div className="flex gap-1 border-b border-neutral-800">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-2 text-sm ${
              tab === t.key
                ? "border-b-2 border-emerald-500 text-neutral-50"
                : "text-neutral-500 hover:text-neutral-300"
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

      <p className="text-xs text-neutral-500">
        Los índices, referencias globales y commodities se muestran mediante ETFs líquidos que
        los replican (no símbolos de índice directos), para evitar mostrar datos no confirmados
        por el proveedor.
      </p>
    </div>
  );
}
