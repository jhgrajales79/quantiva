"use client";

import { useState } from "react";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        title="Notificaciones"
        className="rounded-md p-1.5 text-app-fg-muted transition hover:bg-app-surface-2 hover:text-app-fg"
      >
        🔔
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-lg border border-app-border bg-app-surface p-3 shadow-lg">
            <p className="text-sm font-medium text-app-fg">Notificaciones</p>
            <p className="mt-1 text-sm text-app-fg-muted">
              No tienes notificaciones. Las alertas de precio, Fair Value y earnings estarán
              disponibles próximamente.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
