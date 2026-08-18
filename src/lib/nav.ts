export interface NavItem {
  label: string;
  href: string;
  available: boolean; // false = Fase 2/3, se muestra deshabilitado
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", available: true },
  { label: "Mercados", href: "/markets", available: true },
  { label: "Acciones", href: "/search", available: true },
  { label: "ETFs", href: "/etfs", available: false },
  { label: "Cripto", href: "/markets?tab=crypto", available: true },
  { label: "Screener", href: "/screener", available: false },
  { label: "Fair Value", href: "/search", available: true },
  { label: "Watchlist", href: "/watchlist", available: true },
  { label: "Portafolio", href: "/portfolio", available: true },
  { label: "Comparar", href: "/compare", available: false },
  { label: "Calendario", href: "/calendar", available: false },
  { label: "Noticias", href: "/news", available: true },
  { label: "Macro", href: "/macro", available: true },
  { label: "Dividendos", href: "/dividends", available: false },
  { label: "Earnings", href: "/earnings", available: false },
  { label: "Señales", href: "/signals", available: false },
  { label: "Congress Trading", href: "/congress-trading", available: false },
  { label: "Alertas", href: "/alerts", available: false },
  { label: "Movers", href: "/movers", available: true },
];
