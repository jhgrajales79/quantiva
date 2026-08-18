"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { NAV_ITEMS } from "@/lib/nav";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <nav className="hidden w-56 flex-shrink-0 border-r border-neutral-800 bg-neutral-950 p-3 md:block">
      <ul className="space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          if (!item.available) {
            return (
              <li key={item.label}>
                <span className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-neutral-600">
                  {item.label}
                  <span className="text-[10px] uppercase tracking-wide text-neutral-700">
                    Próx.
                  </span>
                </span>
              </li>
            );
          }
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                className={clsx(
                  "block rounded-md px-3 py-2 text-sm transition",
                  isActive
                    ? "bg-emerald-600/15 text-emerald-400"
                    : "text-neutral-300 hover:bg-neutral-800 hover:text-neutral-100",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
