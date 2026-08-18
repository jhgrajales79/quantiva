"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { SearchBox } from "./SearchBox";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex items-center gap-4 border-b border-neutral-800 bg-neutral-950 px-4 py-3">
      <Link href="/dashboard" className="text-lg font-semibold text-neutral-50">
        Quantiva
      </Link>
      <SearchBox />
      <div className="ml-auto flex items-center gap-3">
        <MarketStatusBadge />
        {session?.user && (
          <span className="hidden text-sm text-neutral-400 sm:inline">
            {session.user.name ?? session.user.email}
          </span>
        )}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="rounded-md border border-neutral-700 px-2.5 py-1 text-xs text-neutral-300 transition hover:bg-neutral-800"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
