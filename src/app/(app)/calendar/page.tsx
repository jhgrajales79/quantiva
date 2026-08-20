"use client";

import { useState } from "react";
import { EconomicCalendar } from "@/components/calendar/EconomicCalendar";
import { EarningsCalendar } from "@/components/calendar/EarningsCalendar";
import { PageHeader } from "@/components/ui/PageHeader";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { CalendarDays } from "lucide-react";

export default function CalendarPage() {
  const [tab, setTab] = useState<"economic" | "earnings">("economic");

  return (
    <div className="space-y-4">
      <PageHeader
        icon={CalendarDays}
        title="Calendario"
        description={
          <>
            Calendario económico y de resultados (EE.UU. e internacional) vía Yahoo Finance. Ninguna
            de las dos fuentes expone consenso de mercado para ingresos ni un valor &quot;Estimado&quot;
            oficial — se muestra &quot;Dato no disponible&quot; en vez de inventarlo.
          </>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as "economic" | "earnings")}>
        <TabsList>
          <TabsTrigger value="economic">Calendario económico</TabsTrigger>
          <TabsTrigger value="earnings">Calendario de resultados</TabsTrigger>
        </TabsList>
        <TabsContent value="economic">
          <EconomicCalendar />
        </TabsContent>
        <TabsContent value="earnings">
          <EarningsCalendar />
        </TabsContent>
      </Tabs>
    </div>
  );
}
