export interface NavItem {
  label: string;
  href: string;
  available: boolean; // false = todavía no construido, se muestra deshabilitado
  pro?: boolean; // muestra candado + acceso libre por ahora (sin pasarela de pagos)
}

// Ítems primarios de la barra superior (igual a img3): Calendario, Watchlist,
// Portafolio, Screener, ETFs, Comparar. El resto vive en el dropdown "Más".
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Calendario", href: "/calendar", available: true },
  { label: "Watchlist", href: "/watchlist", available: true },
  { label: "Portafolio", href: "/portfolio", available: true },
  { label: "Screener", href: "/screener", available: true, pro: true },
  { label: "ETFs", href: "/etfs", available: true, pro: true },
  { label: "Comparar", href: "/compare", available: true, pro: true },
];

export const MORE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", available: true },
  { label: "Mercados", href: "/markets", available: true },
  { label: "Acciones", href: "/search", available: true },
  { label: "Cripto", href: "/markets?tab=crypto", available: true },
  { label: "Noticias", href: "/news", available: true },
  { label: "Macro", href: "/macro", available: true },
  { label: "Movers", href: "/movers", available: true },
  { label: "Dividendos", href: "/dividends", available: false },
  { label: "Earnings", href: "/earnings", available: false },
  { label: "Señales", href: "/signals", available: false },
  { label: "Congress Trading", href: "/congress-trading", available: false },
  { label: "Alertas", href: "/alerts", available: false },
];

// Compatibilidad con código existente que itera todos los ítems.
export const NAV_ITEMS: NavItem[] = [...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS];
