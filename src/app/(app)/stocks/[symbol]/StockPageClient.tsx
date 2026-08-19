"use client";

import { useEffect, useState } from "react";
import { StockHeader } from "@/components/stock/StockHeader";
import { ValuationSummaryCards } from "@/components/stock/ValuationSummaryCards";
import { PriceChartSection } from "@/components/stock/PriceChartSection";
import { FundamentalsMiniCards } from "@/components/stock/FundamentalsMiniCards";
import { ValuationVsHistoryTable } from "@/components/stock/ValuationVsHistoryTable";
import { ProfitabilityVsHistoryTable } from "@/components/stock/ProfitabilityVsHistoryTable";
import { FinancialHealthCard } from "@/components/stock/FinancialHealthCard";
import { DividendsCard } from "@/components/stock/DividendsCard";
import { CompanyProfileCard } from "@/components/stock/CompanyProfileCard";
import { AnalystConsensusCard } from "@/components/stock/AnalystConsensusCard";
import { NewsFilingsTabs } from "@/components/stock/NewsFilingsTabs";
import { SimilarCompaniesGrid } from "@/components/stock/SimilarCompaniesGrid";
import { FairValueModels } from "@/components/cards/FairValueModels";
import { ScoresPanel } from "@/components/stock/ScoresPanel";

interface ValuationModelsResponse {
  possibleValueTrap: boolean;
  models: { model: string; fairValue: number | null; assumptions: Record<string, unknown>; unavailableReason: string | null }[];
}

export function StockPageClient({ symbol }: { symbol: string }) {
  const [valuation, setValuation] = useState<ValuationModelsResponse | null>(null);

  useEffect(() => {
    fetch(`/api/valuation/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setValuation)
      .catch(() => setValuation(null));
  }, [symbol]);

  return (
    <div className="space-y-6">
      <StockHeader symbol={symbol} />

      <ValuationSummaryCards symbol={symbol} />

      <ScoresPanel symbol={symbol} />

      {valuation?.possibleValueTrap && (
        <div className="rounded-md border border-amber-700/50 bg-amber-900/20 p-3 text-sm text-amber-300">
          ⚠️ Possible Value Trap: la acción parece barata, pero presenta señales de deterioro
          fundamental (caída de ingresos, FCF negativo o deuda elevada).
        </div>
      )}

      <PriceChartSection symbol={symbol} />

      <FundamentalsMiniCards symbol={symbol} />

      <div className="grid gap-4 lg:grid-cols-2">
        <ValuationVsHistoryTable symbol={symbol} />
        <ProfitabilityVsHistoryTable symbol={symbol} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <FinancialHealthCard symbol={symbol} />
        <DividendsCard symbol={symbol} />
      </div>

      {valuation && <FairValueModels models={valuation.models} />}

      <CompanyProfileCard symbol={symbol} />

      <div className="grid gap-4 lg:grid-cols-2">
        <AnalystConsensusCard symbol={symbol} />
        <NewsFilingsTabs symbol={symbol} />
      </div>

      <SimilarCompaniesGrid symbol={symbol} />
    </div>
  );
}
