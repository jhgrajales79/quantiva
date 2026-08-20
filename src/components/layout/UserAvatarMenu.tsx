"use client";

import { useSession, signOut } from "next-auth/react";
import { ChevronDown, LogOut } from "lucide-react";
import { Menu, MenuItem, MenuLabel, MenuSeparator } from "@/components/ui/Menu";

function getInitials(nameOrEmail: string): string {
  const parts = nameOrEmail.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export function UserAvatarMenu() {
  const { data: session } = useSession();
  const displayName = session?.user?.name ?? session?.user?.email ?? "Usuario";
  const initials = getInitials(displayName);

  return (
    <Menu
      trigger={
        <button className="flex items-center gap-2 rounded-md p-1 transition-colors hover:bg-app-surface-2">
          <span className="hidden text-sm text-app-fg-muted sm:inline">{displayName}</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-pill bg-brand text-xs font-semibold text-white">
            {initials}
          </span>
          <ChevronDown size={14} strokeWidth={2} className="text-app-fg-muted" />
        </button>
      }
    >
      <MenuLabel>{displayName}</MenuLabel>
      <MenuSeparator />
      <MenuItem icon={LogOut} danger onSelect={() => signOut({ callbackUrl: "/login" })}>
        Cerrar sesión
      </MenuItem>
    </Menu>
  );
}
