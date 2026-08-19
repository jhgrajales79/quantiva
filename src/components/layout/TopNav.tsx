"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { PRIMARY_NAV_ITEMS, MORE_NAV_ITEMS } from "@/lib/nav";

export function TopNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="flex items-center gap-1 border-b border-app-border bg-app-bg px-4 py-1.5 overflow-x-auto">
      {PRIMARY_NAV_ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className={clsx(
            "flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition",
            isActive(item.href)
              ? "bg-app-surface-2 text-app-fg"
              : "text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg",
          )}
        >
          {item.label}
          {item.pro && <span title="Función PRO">🔒</span>}
        </Link>
      ))}

      <div className="relative">
        <button
          onClick={() => setMoreOpen((v) => !v)}
          className="flex items-center gap-1 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium text-app-fg-muted transition hover:bg-app-surface-2 hover:text-app-fg"
        >
          Más ▾
        </button>
        {moreOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMoreOpen(false)} />
            <div className="absolute left-0 z-20 mt-2 w-56 rounded-lg border border-app-border bg-app-surface p-1 shadow-lg">
              {MORE_NAV_ITEMS.map((item) =>
                item.available ? (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setMoreOpen(false)}
                    className={clsx(
                      "block rounded-md px-3 py-2 text-sm transition",
                      isActive(item.href)
                        ? "bg-app-surface-2 text-app-fg"
                        : "text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg",
                    )}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    key={item.label}
                    className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-app-fg-faint"
                  >
                    {item.label}
                    <span className="text-[10px] uppercase tracking-wide">Próx.</span>
                  </span>
                ),
              )}
            </div>
          </>
        )}
      </div>
    </nav>
  );
}
