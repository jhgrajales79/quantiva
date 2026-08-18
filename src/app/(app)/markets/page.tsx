"use client";

import { useState } from "react";
import { QuotesTable } from "@/components/market/QuotesTable";
import { CryptoTable } from "@/components/market/CryptoTable";

const TABS = [
  { key: "us", label: "Estados Unidos" },
  { key: "global", label: "Global" },
  { key: "crypto", label: "Cripto" },
  { key: "commodities", label: "Commodities" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

// Proxies vía ETFs/tickers líquidos: los símbolos de índice varían por
// proveedor y muchos no están disponibles en el tier gratuito de FMP, así
// que se usan ETFs que replican cada referencia en vez de inventar acceso a
// datos de índice que no tenemos confirmados.
const US_SYMBOLS = [
  { symbol: "SPY", label: "S&P 500 (SPY)" },
  { symbol: "QQQ", label: "Nasdaq 100 (QQQ)" },
  { symbol: "DIA", label: "Dow Jones (DIA)" },
  { symbol: "IWM", label: "Russell 2000 (IWM)" },
];

const GLOBAL_SYMBOLS = [
  { symbol: "ACWI", label: "MSCI World (ACWI)" },
  { symbol: "EEM", label: "MSCI Emerging Markets (EEM)" },
  { symbol: "VGK", label: "Europa (VGK)" },
  { symbol: "VPL", label: "Asia-Pacífico (VPL)" },
  { symbol: "ILF", label: "Latinoamérica (ILF)" },
];

const COMMODITY_SYMBOLS = [
  { symbol: "GLD", label: "Oro (GLD)" },
  { symbol: "SLV", label: "Plata (SLV)" },
  { symbol: "USO", label: "Petróleo WTI (USO)" },
  { symbol: "UNG", label: "Gas Natural (UNG)" },
  { symbol: "CPER", label: "Cobre (CPER)" },
];

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

      <p className="text-xs text-neutral-500">
        Los índices, referencias globales y commodities se muestran mediante ETFs líquidos que
        los replican (no símbolos de índice directos), para evitar mostrar datos no confirmados
        por el proveedor.
      </p>
    </div>
  );
}
