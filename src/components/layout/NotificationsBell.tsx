"use client";

import { Bell } from "lucide-react";
import { Menu } from "@/components/ui/Menu";

export function NotificationsBell() {
  return (
    <Menu
      trigger={
        <button
          aria-label="Notificaciones"
          title="Notificaciones"
          className="rounded-md p-1.5 text-app-fg-muted transition-colors hover:bg-app-surface-2 hover:text-app-fg"
        >
          <Bell size={18} strokeWidth={2} />
        </button>
      }
    >
      <div className="w-64 px-2.5 py-2">
        <p className="text-sm font-medium text-app-fg">Notificaciones</p>
        <p className="mt-1 text-sm text-app-fg-muted">
          No tienes notificaciones. Las alertas de precio, Fair Value y earnings estarán
          disponibles próximamente.
        </p>
      </div>
    </Menu>
  );
}
