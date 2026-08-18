import { WatchlistTable } from "@/components/tables/WatchlistTable";
import { LinkCard } from "@/components/cards/LinkCard";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-50">Market Today</h1>
        <p className="text-sm text-neutral-500">
          Tu centro de inteligencia financiera: qué está pasando hoy y cómo afecta a tu
          portafolio.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <LinkCard href="/markets" title="Mercados">
          Índices, cripto y commodities en vivo por pestañas.
        </LinkCard>
        <LinkCard href="/movers" title="Market Movers">
          Top gainers, losers y most active del día.
        </LinkCard>
        <LinkCard href="/macro" title="Macro">
          CPI, empleo, Fed Funds, yield curve y más, desde FRED.
        </LinkCard>
        <LinkCard href="/news" title="Noticias">
          Feed de noticias por empresa, categorizado.
        </LinkCard>
      </div>

      <WatchlistTable />

      <LinkCard href="/portfolio" title="Mi Portafolio">
        Crea portafolios, registra transacciones y sigue tu P&amp;L, retorno y peso por
        posición.
      </LinkCard>
    </div>
  );
}
