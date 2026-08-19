"use client";

import Link from "next/link";
import { MarketStatusBadge } from "./MarketStatusBadge";
import { SearchBox } from "./SearchBox";
import { NotificationsBell } from "./NotificationsBell";
import { UpgradeProButton } from "./UpgradeProButton";
import { ThemeToggle } from "./ThemeToggle";
import { FontSizeToggle } from "./FontSizeToggle";
import { UserAvatarMenu } from "./UserAvatarMenu";

export function Header() {
  return (
    <header className="flex items-center gap-4 border-b border-app-border bg-app-bg px-4 py-3">
      <Link href="/dashboard" className="text-lg font-semibold text-app-fg">
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
    </header>
  );
}
