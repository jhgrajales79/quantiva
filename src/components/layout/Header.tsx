"use client";

import Link from "next/link";
import { LineChart } from "lucide-react";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { SearchBox } from "./SearchBox";
import { NotificationsBell } from "./NotificationsBell";
import { UpgradeProButton } from "./UpgradeProButton";
import { ThemeToggle } from "./ThemeToggle";
import { FontSizeToggle } from "./FontSizeToggle";
import { UserAvatarMenu } from "./UserAvatarMenu";

export function Header() {
  return (
    <header className="border-b border-app-border bg-app-bg">
      <div className="mx-auto flex w-full max-w-[1440px] items-center gap-4 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-1.5 text-lg font-semibold text-app-fg">
          <LineChart size={20} strokeWidth={2.25} className="text-brand" />
          Quantiva
        </Link>
        <SearchBox />
        <div className="ml-auto flex items-center gap-2">
          <MarketStatusBadge />
          <NotificationsBell />
          <UpgradeProButton />
          <FontSizeToggle />
          <ThemeToggle />
          <UserAvatarMenu />
        </div>
      </div>
    </header>
  );
}
