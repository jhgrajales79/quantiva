import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  Eye,
  Briefcase,
  SlidersHorizontal,
  PieChart,
  GitCompareArrows,
  LayoutDashboard,
  Globe,
  Search,
  Bitcoin,
  Newspaper,
  Activity,
  TrendingUp,
  Landmark,
  Bell,
  Building2,
  Gavel,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  available: boolean; // false = todavía no construido, se muestra deshabilitado
  pro?: boolean; // muestra candado + acceso libre por ahora (sin pasarela de pagos)
  icon: LucideIcon;
}

// Ítems primarios de la barra superior (igual a img3): Calendario, Watchlist,
// Portafolio, Screener, ETFs, Comparar. El resto vive en el dropdown "Más".
export const PRIMARY_NAV_ITEMS: NavItem[] = [
  { label: "Calendario", href: "/calendar", available: true, icon: CalendarDays },
  { label: "Watchlist", href: "/watchlist", available: true, icon: Eye },
  { label: "Portafolio", href: "/portfolio", available: true, icon: Briefcase },
  { label: "Screener", href: "/screener", available: true, pro: true, icon: SlidersHorizontal },
  { label: "ETFs", href: "/etfs", available: true, pro: true, icon: PieChart },
  { label: "Comparar", href: "/compare", available: true, pro: true, icon: GitCompareArrows },
];

export const MORE_NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", available: true, icon: LayoutDashboard },
  { label: "Mercados", href: "/markets", available: true, icon: Globe },
  { label: "Acciones", href: "/search", available: true, icon: Search },
  { label: "Cripto", href: "/markets?tab=crypto", available: true, icon: Bitcoin },
  { label: "Noticias", href: "/news", available: true, icon: Newspaper },
  { label: "Macro", href: "/macro", available: true, icon: Landmark },
  { label: "Movers", href: "/movers", available: true, icon: TrendingUp },
  { label: "Dividendos", href: "/dividends", available: false, icon: Activity },
  { label: "Earnings", href: "/earnings", available: false, icon: Building2 },
  { label: "Señales", href: "/signals", available: false, icon: Bell },
  { label: "Congress Trading", href: "/congress-trading", available: false, icon: Gavel },
  { label: "Alertas", href: "/alerts", available: false, icon: Bell },
];

// Compatibilidad con código existente que itera todos los ítems.
export const NAV_ITEMS: NavItem[] = [...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS];
