"use client";

import { useState } from "react";
import { EconomicCalendar } from "@/components/calendar/EconomicCalendar";
import { EarningsCalendar } from "@/components/calendar/EarningsCalendar";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  const [tab, setTab] = useState<"economic" | "earnings">("economic");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-app-fg">
          <CalendarDays size={20} strokeWidth={2} />
          Calendario
        </h1>
        <p className="text-sm text-app-fg-muted">
          Calendario económico y de resultados (EE.UU. e internacional) vía Yahoo Finance. Ninguna
          de las dos fuentes expone consenso de mercado para ingresos ni un valor "Estimado"
          oficial — se muestra "Dato no disponible" en vez de inventarlo.
        </p>
      </div>

      <div className="flex gap-1.5 border-b border-app-border pb-px">
        {(
          [
            ["economic", "Calendario económico"],
            ["earnings", "Calendario de resultados"],
          ] as [typeof tab, string][]
        ).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setTab(value)}
            className={`rounded-t-md px-3 py-2 text-sm font-medium ${
              tab === value
                ? "border-b-2 border-orange-500 text-app-fg"
                : "text-app-fg-muted hover:text-app-fg"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "economic" ? <EconomicCalendar /> : <EarningsCalendar />}
    </div>
  );
}
