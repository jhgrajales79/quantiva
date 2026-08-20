"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import clsx from "clsx";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function Menu({
  trigger,
  children,
  align = "end",
  sideOffset = 8,
}: {
  trigger: React.ReactNode;
  children: React.ReactNode;
  align?: "start" | "end" | "center";
  sideOffset?: number;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>{trigger}</DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align={align}
          sideOffset={sideOffset}
          className={clsx(
            "z-50 min-w-48 rounded-card border border-app-border bg-app-surface p-1 shadow-popover",
            "qv-pop",
          )}
        >
          {children}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export function MenuItem({
  children,
  onSelect,
  href,
  icon: Icon,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onSelect?: () => void;
  href?: string;
  icon?: LucideIcon;
  danger?: boolean;
  disabled?: boolean;
}) {
  const itemClass = clsx(
    "flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm outline-none transition-colors",
    "data-[highlighted]:bg-app-surface-2",
    danger ? "text-negative" : "text-app-fg",
    disabled && "pointer-events-none opacity-50",
  );

  if (href) {
    return (
      <DropdownMenu.Item asChild disabled={disabled}>
        <Link href={href} className={itemClass}>
          {Icon && <Icon size={15} strokeWidth={2} />}
          {children}
        </Link>
      </DropdownMenu.Item>
    );
  }

  return (
    <DropdownMenu.Item className={itemClass} onSelect={onSelect} disabled={disabled}>
      {Icon && <Icon size={15} strokeWidth={2} />}
      {children}
    </DropdownMenu.Item>
  );
}

export function MenuLabel({ children }: { children: React.ReactNode }) {
  return (
    <DropdownMenu.Label className="px-2.5 py-1.5 text-xs text-app-fg-faint">{children}</DropdownMenu.Label>
  );
}

export function MenuSeparator() {
  return <DropdownMenu.Separator className="my-1 h-px bg-app-border" />;
}
