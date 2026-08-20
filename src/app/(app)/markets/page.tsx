"use client";

import { useState } from "react";
import { QuotesTable } from "@/components/market/QuotesTable";
import { CryptoTable } from "@/components/market/CryptoTable";
import { US_SYMBOLS, GLOBAL_SYMBOLS, COMMODITY_SYMBOLS, FX_PAIRS } from "@/lib/market-symbols";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
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
      <PageHeader title="Mercados" icon={Globe} />

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          {TABS.map((t) => (
            <TabsTrigger key={t.key} value={t.key}>
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="us">
          <QuotesTable symbols={US_SYMBOLS} />
        </TabsContent>
        <TabsContent value="global">
          <QuotesTable symbols={GLOBAL_SYMBOLS} />
        </TabsContent>
        <TabsContent value="crypto">
          <CryptoTable />
        </TabsContent>
        <TabsContent value="commodities">
          <QuotesTable symbols={COMMODITY_SYMBOLS} />
        </TabsContent>
        <TabsContent value="fx">
          <QuotesTable symbols={FX_PAIRS} />
        </TabsContent>
      </Tabs>

      <p className="text-xs text-app-fg-muted">
        Los índices, referencias globales y commodities se muestran mediante ETFs líquidos que
        los replican (no símbolos de índice directos), para evitar mostrar datos no confirmados
        por el proveedor.
      </p>
    </div>
  );
}
