"use client";

import { useEffect, useState } from "react";
import { applyFontScale, getStoredFontScale, type FontScale } from "@/lib/theme";

const CYCLE: FontScale[] = ["sm", "md", "lg"];

export function FontSizeToggle() {
  const [scale, setScale] = useState<FontScale>("md");

  useEffect(() => {
    setScale(getStoredFontScale());
  }, []);

  function cycle() {
    const nextIndex = (CYCLE.indexOf(scale) + 1) % CYCLE.length;
    const next = CYCLE[nextIndex];
    applyFontScale(next);
    setScale(next);
  }

  return (
    <button
      onClick={cycle}
      aria-label="Cambiar tamaño de fuente"
      title="Cambiar tamaño de fuente"
      className="rounded-md px-2 py-1.5 text-xs font-semibold text-app-fg-muted transition hover:bg-app-surface-2 hover:text-app-fg"
    >
      AA
    </button>
  );
}
