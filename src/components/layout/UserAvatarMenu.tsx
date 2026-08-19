"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";

function getInitials(nameOrEmail: string): string {
  const parts = nameOrEmail.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export function UserAvatarMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  const displayName = session?.user?.name ?? session?.user?.email ?? "Usuario";
  const initials = getInitials(displayName);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-md p-1 transition hover:bg-app-surface-2"
      >
        <span className="hidden text-sm text-app-fg-muted sm:inline">{displayName}</span>
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-xs font-semibold text-white">
          {initials}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-app-border bg-app-surface p-1 shadow-lg">
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="block w-full rounded-md px-3 py-2 text-left text-sm text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg"
            >
              Cerrar sesión
            </button>
          </div>
        </>
      )}
    </div>
  );
}
