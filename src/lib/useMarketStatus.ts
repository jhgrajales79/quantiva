"use client";

import { useEffect, useState } from "react";
import type { MarketStatus } from "@/lib/cache";

export interface MarketStatusState {
  status: MarketStatus | null;
  minutesToNextTransition: number | null;
}

export function useMarketStatus(): MarketStatusState {
  const [state, setState] = useState<MarketStatusState>({
    status: null,
    minutesToNextTransition: null,
  });

  useEffect(() => {
    let mounted = true;
    fetch("/api/market-status")
      .then((res) => res.json())
      .then((data) => {
        if (mounted) setState(data);
      })
      .catch(() => {
        if (mounted) setState({ status: null, minutesToNextTransition: null });
      });
    return () => {
      mounted = false;
    };
  }, []);

  return state;
}

export function formatCountdown(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
