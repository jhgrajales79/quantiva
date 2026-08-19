"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { applyTheme, getStoredTheme, type ThemeMode } from "@/lib/theme";

function resolveEffectiveMode(mode: ThemeMode): "light" | "dark" {
  if (mode !== "system") return mode;
  if (typeof window === "undefined") return "dark"; // valor neutro durante SSR
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    setMode(getStoredTheme());
  }, []);

  function toggle() {
    const effective = resolveEffectiveMode(mode);
    const next: ThemeMode = effective === "dark" ? "light" : "dark";
    applyTheme(next);
    setMode(next);
  }

  const effective = resolveEffectiveMode(mode);

  return (
    <button
      onClick={toggle}
      aria-label={effective === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={effective === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="rounded-md p-1.5 text-app-fg-muted transition hover:bg-app-surface-2 hover:text-app-fg"
    >
      {effective === "dark" ? <Moon size={17} strokeWidth={2} /> : <Sun size={17} strokeWidth={2} />}
    </button>
  );
}
