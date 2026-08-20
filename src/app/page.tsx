import Link from "next/link";
import {
  Eye,
  Briefcase,
  Gauge,
  SlidersHorizontal,
  GitCompareArrows,
  CalendarDays,
  Globe,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { getMarketDataProvider } from "@/lib/providers/registry";
import { getMarketStatusDetail } from "@/lib/cache";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Card } from "@/components/ui/Card";
import { Logo } from "@/components/layout/Logo";
import { Disclaimer } from "@/components/layout/Disclaimer";

const TICKER_STRIP = [
  { symbol: "SPY", label: "S&P 500" },
  { symbol: "QQQ", label: "Nasdaq 100" },
  { symbol: "DIA", label: "Dow Jones" },
  { symbol: "IWM", label: "Russell 2000" },
];

const FEATURES = [
  {
    icon: Eye,
    title: "Watchlist en vivo",
    description: "Sigue tus acciones favoritas con precio, variación diaria y valor razonable actualizados en tiempo real.",
  },
  {
    icon: Briefcase,
    title: "Portafolio con P&L real",
    description: "Registra tus compras y ventas y calcula tu ganancia/pérdida realizada y no realizada al instante.",
  },
  {
    icon: Gauge,
    title: "Fair Value Engine",
    description: "Modelos DCF, P/E relativo, EV/EBITDA, P/S y Graham Number sobre datos reales, no estimaciones inventadas.",
  },
  {
    icon: SlidersHorizontal,
    title: "Screener cuantitativo",
    description: "Filtra el S&P 500 por valoración, momentum, dividendo o cercanía a máximos/mínimos de 52 semanas.",
  },
  {
    icon: GitCompareArrows,
    title: "Comparador",
    description: "Compara hasta 5 activos lado a lado en valoración, crecimiento, calidad, rentabilidad y dividendos.",
  },
  {
    icon: CalendarDays,
    title: "Calendario de resultados",
    description: "No te pierdas la próxima fecha de earnings de las empresas que sigues.",
  },
];

export default async function LandingPage() {
  const [session, marketStatus, quoteResults] = await Promise.all([
    auth(),
    Promise.resolve(getMarketStatusDetail()),
    Promise.allSettled(
      TICKER_STRIP.map((t) => getMarketDataProvider().getQuote(t.symbol)),
    ),
  ]);

  const quotes = TICKER_STRIP.map((t, i) => {
    const result = quoteResults[i];
    const quote = result.status === "fulfilled" ? result.value : null;
    return { ...t, quote };
  }).filter((t) => t.quote !== null);

  const isLoggedIn = Boolean(session?.user);
  const primaryHref = isLoggedIn ? "/dashboard" : "/register";
  const primaryLabel = isLoggedIn ? "Ir a mi panel" : "Crear cuenta gratis";
  const loginHref = isLoggedIn ? "/dashboard" : "/login";
  const loginLabel = isLoggedIn ? "Ir a mi panel" : "Iniciar sesión";

  return (
    <div className="flex min-h-screen flex-col bg-app-bg">
      <header className="border-b border-app-border">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4">
          <div className="flex items-center gap-1.5 text-lg font-semibold text-app-fg">
            <Logo size={28} />
            Quantiva
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`hidden items-center gap-1.5 rounded-pill px-2.5 py-1 text-xs font-medium sm:inline-flex ${
                marketStatus.status === "open"
                  ? "bg-positive/15 text-positive"
                  : marketStatus.status === "closed"
                    ? "bg-app-surface-2 text-app-fg-muted"
                    : "bg-warning/15 text-warning"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-pill ${
                  marketStatus.status === "open" ? "bg-positive animate-pulse" : "bg-current"
                }`}
              />
              {marketStatus.status === "open"
                ? "Mercado abierto"
                : marketStatus.status === "closed"
                  ? "Mercado cerrado"
                  : marketStatus.status === "pre-market"
                    ? "Pre-market"
                    : "After-hours"}
            </span>
            <Link
              href={loginHref}
              className="rounded-md px-3 py-1.5 text-sm font-medium text-app-fg-muted transition-colors hover:bg-app-surface-2 hover:text-app-fg"
            >
              {loginLabel}
            </Link>
            {!isLoggedIn && (
              <Link
                href="/register"
                className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90"
              >
                Crear cuenta
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto w-full max-w-[1200px] px-4 pt-16 pb-12 text-center">
          <span className="mx-auto mb-4 inline-flex items-center gap-1.5 rounded-pill border border-app-border bg-app-surface px-3 py-1 text-xs font-medium text-app-fg-muted">
            <Sparkles size={13} strokeWidth={2.5} className="text-brand" />
            Datos reales de Yahoo Finance, sin recomendaciones fabricadas
          </span>
          <h1 className="mx-auto max-w-3xl text-4xl font-semibold tracking-tight text-app-fg sm:text-5xl">
            Tu centro de inteligencia financiera, en un solo lugar
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-app-fg-muted sm:text-lg">
            Watchlist, portafolio, valoración por Fair Value, screener y comparador — con datos de
            mercado reales y actualizados, no simulados.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={primaryHref}
              className="flex items-center gap-1.5 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              {primaryLabel}
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>
            {!isLoggedIn && (
              <Link
                href="/login"
                className="rounded-md border border-app-border px-5 py-2.5 text-sm font-medium text-app-fg transition-colors hover:bg-app-surface-2"
              >
                Ya tengo cuenta
              </Link>
            )}
          </div>

          {/* Franja de cotizaciones reales */}
          {quotes.length > 0 && (
            <div className="mx-auto mt-12 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">
              {quotes.map(({ symbol, label, quote }) => {
                const positive = (quote?.changePct ?? 0) >= 0;
                return (
                  <Card key={symbol} className="text-left">
                    <p className="text-xs text-app-fg-muted">{label}</p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-app-fg">
                      {formatCurrency(quote!.price)}
                    </p>
                    <p className={`text-sm tabular-nums ${positive ? "text-positive" : "text-negative"}`}>
                      {formatPercent(quote!.changePct === null ? null : quote!.changePct / 100)}
                    </p>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-[1200px] px-4 py-16">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="text-2xl font-semibold text-app-fg">Todo lo que necesitas para decidir</h2>
            <p className="mt-2 text-sm text-app-fg-muted">
              Cada módulo está diseñado para que veas la información completa antes de tomar una
              decisión — nunca solo un número aislado.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <f.icon size={22} strokeWidth={2} className="text-brand" />
                <h3 className="mt-3 text-sm font-semibold text-app-fg">{f.title}</h3>
                <p className="mt-1 text-sm text-app-fg-muted">{f.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* Por qué Quantiva */}
        <section className="border-t border-app-border bg-app-surface/40">
          <div className="mx-auto w-full max-w-[1200px] px-4 py-16">
            <div className="grid gap-8 sm:grid-cols-3">
              <div>
                <Globe size={22} strokeWidth={2} className="text-brand" />
                <h3 className="mt-3 text-sm font-semibold text-app-fg">Mercados globales</h3>
                <p className="mt-1 text-sm text-app-fg-muted">
                  Acciones, ETFs, cripto, materias primas, divisas y macroeconomía (Fed, inflación,
                  PIB) en un mismo panel.
                </p>
              </div>
              <div>
                <Gauge size={22} strokeWidth={2} className="text-brand" />
                <h3 className="mt-3 text-sm font-semibold text-app-fg">Honestidad sobre los datos</h3>
                <p className="mt-1 text-sm text-app-fg-muted">
                  Cuando un dato no está disponible, lo decimos claramente — nunca inventamos un
                  número para rellenar un espacio.
                </p>
              </div>
              <div>
                <SlidersHorizontal size={22} strokeWidth={2} className="text-brand" />
                <h3 className="mt-3 text-sm font-semibold text-app-fg">Personalizable de verdad</h3>
                <p className="mt-1 text-sm text-app-fg-muted">
                  Reordena, redimensiona y elige qué widgets ver en tu panel — tu configuración se
                  guarda automáticamente.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA final */}
        {!isLoggedIn && (
          <section className="mx-auto w-full max-w-[1200px] px-4 py-16 text-center">
            <h2 className="text-2xl font-semibold text-app-fg">Empieza a invertir con información real</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-app-fg-muted">
              Crear tu cuenta toma menos de un minuto. Sin tarjeta de crédito.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/register"
                className="flex items-center gap-1.5 rounded-md bg-brand px-5 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
              >
                Crear cuenta gratis
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>
              <Link
                href="/login"
                className="rounded-md border border-app-border px-5 py-2.5 text-sm font-medium text-app-fg transition-colors hover:bg-app-surface-2"
              >
                Iniciar sesión
              </Link>
            </div>
          </section>
        )}
      </main>

      <Disclaimer />
    </div>
  );
}
