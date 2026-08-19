export type ThemeMode = "light" | "dark" | "system";
export type FontScale = "sm" | "md" | "lg";

const THEME_KEY = "quantiva-theme";
const FONT_SCALE_KEY = "quantiva-font-scale";

const FONT_SCALE_VALUES: Record<FontScale, string> = {
  sm: "0.9",
  md: "1",
  lg: "1.125",
};

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", mode);
  }
  localStorage.setItem(THEME_KEY, mode);
}

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" ? stored : "system";
}

export function applyFontScale(scale: FontScale) {
  document.documentElement.style.setProperty("--app-font-scale", FONT_SCALE_VALUES[scale]);
  localStorage.setItem(FONT_SCALE_KEY, scale);
}

export function getStoredFontScale(): FontScale {
  if (typeof window === "undefined") return "md";
  const stored = localStorage.getItem(FONT_SCALE_KEY);
  return stored === "sm" || stored === "md" || stored === "lg" ? stored : "md";
}

/**
 * Script inline para inyectar en <head> (antes del primer paint) y evitar el
 * parpadeo de tema/tamaño de fuente al cargar la página.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var theme = localStorage.getItem("${THEME_KEY}");
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    }
    var scale = localStorage.getItem("${FONT_SCALE_KEY}");
    var scaleMap = { sm: "0.9", md: "1", lg: "1.125" };
    if (scale && scaleMap[scale]) {
      document.documentElement.style.setProperty("--app-font-scale", scaleMap[scale]);
    }
  } catch (e) {}
})();
`;
