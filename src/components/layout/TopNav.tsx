"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { Lock, Clock, ChevronDown, Menu as MenuIcon } from "lucide-react";
import { PRIMARY_NAV_ITEMS, MORE_NAV_ITEMS } from "@/lib/nav";
import { Menu, MenuItem } from "@/components/ui/Menu";
import { Dialog } from "@/components/ui/Dialog";

export function TopNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  const activeLabel =
    [...PRIMARY_NAV_ITEMS, ...MORE_NAV_ITEMS].find((item) => isActive(item.href))?.label ?? "Menú";

  return (
    <nav className="border-b border-app-border bg-app-bg">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-1 px-4 py-1.5">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center rounded-md p-1.5 text-app-fg-muted transition-colors hover:bg-app-surface-2 hover:text-app-fg md:hidden"
          aria-label="Abrir navegación"
        >
          <MenuIcon size={18} strokeWidth={2} />
        </button>
        <span className="truncate text-sm font-medium text-app-fg md:hidden">{activeLabel}</span>

        {/* overflow-x-auto vive en este contenedor interno (no en <nav>) para
            que no fuerce overflow-y:auto y recorte el menú "Más" de abajo. */}
        <div className="hidden min-w-0 items-center gap-1 overflow-x-auto md:flex">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className={clsx(
                  "flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-app-surface-2 text-app-fg"
                    : "text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg",
                )}
              >
                <Icon size={16} strokeWidth={2} />
                {item.label}
                {item.pro && (
                  <Lock size={12} strokeWidth={2.5} className="text-app-fg-faint" aria-label="Función PRO" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden shrink-0 md:block">
          <Menu
            align="start"
            trigger={
              <button className="flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-app-fg-muted transition-colors hover:bg-app-surface-2 hover:text-app-fg">
                Más
                <ChevronDown size={15} strokeWidth={2} />
              </button>
            }
          >
            {MORE_NAV_ITEMS.map((item) =>
              item.available ? (
                <MenuItem key={item.label} href={item.href} icon={item.icon}>
                  {item.label}
                </MenuItem>
              ) : (
                <div
                  key={item.label}
                  className="flex cursor-not-allowed items-center justify-between rounded-md px-2.5 py-2 text-sm text-app-fg-faint"
                >
                  <span className="flex items-center gap-2">
                    <item.icon size={15} strokeWidth={2} />
                    {item.label}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide">
                    <Clock size={11} strokeWidth={2.5} />
                    Próx.
                  </span>
                </div>
              ),
            )}
          </Menu>
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen} title="Navegación">
        <nav className="-mx-1 flex max-h-[70vh] flex-col gap-0.5 overflow-y-auto">
          {PRIMARY_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-app-surface-2 text-app-fg"
                    : "text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg",
                )}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
                {item.pro && <Lock size={12} strokeWidth={2.5} className="ml-auto text-app-fg-faint" />}
              </Link>
            );
          })}
          <div className="my-1 h-px bg-app-border" />
          {MORE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return item.available ? (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={clsx(
                  "flex items-center gap-2.5 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-app-surface-2 text-app-fg"
                    : "text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg",
                )}
              >
                <Icon size={17} strokeWidth={2} />
                {item.label}
              </Link>
            ) : (
              <span
                key={item.label}
                className="flex items-center justify-between rounded-md px-3 py-2.5 text-sm text-app-fg-faint"
              >
                <span className="flex items-center gap-2.5">
                  <Icon size={17} strokeWidth={2} />
                  {item.label}
                </span>
                <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide">
                  <Clock size={11} strokeWidth={2.5} />
                  Próx.
                </span>
              </span>
            );
          })}
        </nav>
      </Dialog>
    </nav>
  );
}
