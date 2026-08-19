"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { DASHBOARD_WIDGET_DEFS, DEFAULT_DASHBOARD_WIDGETS, sanitizeWidgetList } from "@/lib/dashboard-widgets";
import { WatchlistSummaryCard } from "./WatchlistSummaryCard";
import { PortfolioSummaryCard } from "./PortfolioSummaryCard";
import { NewsSummaryCard } from "./NewsSummaryCard";
import { MarketMonitorWidget } from "./MarketMonitorWidget";
import { SectorRotationWidget } from "./SectorRotationWidget";
import { FearGreedWidget } from "./FearGreedWidget";
import { MarketBreadthWidget } from "./MarketBreadthWidget";
import { MacroStrip } from "./MacroStrip";

const WIDGET_COMPONENTS: Record<string, React.ComponentType> = {
  watchlist: WatchlistSummaryCard,
  portfolio: PortfolioSummaryCard,
  news: NewsSummaryCard,
  market_monitor: MarketMonitorWidget,
  sector_rotation: SectorRotationWidget,
  fear_greed: FearGreedWidget,
  market_breadth: MarketBreadthWidget,
  macro: MacroStrip,
};

const WIDGET_SPAN: Record<string, "half" | "full"> = Object.fromEntries(
  DASHBOARD_WIDGET_DEFS.map((w) => [w.id, w.span]),
);

function CustomizePanel({
  current,
  onClose,
  onSave,
}: {
  current: string[];
  onClose: () => void;
  onSave: (widgets: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(current);

  const enabledSet = new Set(draft);
  const ordered = [
    ...draft,
    ...DASHBOARD_WIDGET_DEFS.map((w) => w.id).filter((id) => !enabledSet.has(id)),
  ];

  function toggle(id: string) {
    setDraft((prev) => (prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]));
  }

  function move(id: string, direction: -1 | 1) {
    setDraft((prev) => {
      const idx = prev.indexOf(id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swapWith = idx + direction;
      if (swapWith < 0 || swapWith >= next.length) return prev;
      [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-app-border bg-app-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-app-fg">Personalizar panel</h3>
          <button onClick={onClose} className="rounded-md p-1 text-app-fg-muted hover:bg-app-surface-2">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <p className="mb-4 text-sm text-app-fg-muted">
          Elige qué widgets ver en tu panel y en qué orden aparecen.
        </p>

        <ul className="space-y-1.5">
          {ordered.map((id) => {
            const def = DASHBOARD_WIDGET_DEFS.find((w) => w.id === id)!;
            const enabled = enabledSet.has(id);
            const enabledIdx = draft.indexOf(id);
            return (
              <li
                key={id}
                className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
                  enabled ? "border-app-border bg-app-surface-2" : "border-app-border/50 opacity-60"
                }`}
              >
                <GripVertical size={15} strokeWidth={2} className="shrink-0 text-app-fg-faint" />
                <label className="flex flex-1 cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={() => toggle(id)}
                    className="h-4 w-4 rounded border-app-border"
                  />
                  <span>
                    <span className="block text-sm font-medium text-app-fg">{def.label}</span>
                    <span className="block text-xs text-app-fg-muted">{def.description}</span>
                  </span>
                </label>
                {enabled && (
                  <div className="flex shrink-0 flex-col">
                    <button
                      onClick={() => move(id, -1)}
                      disabled={enabledIdx === 0}
                      className="rounded p-0.5 text-app-fg-muted hover:bg-app-surface disabled:opacity-30"
                      aria-label="Subir"
                    >
                      <ChevronUp size={14} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => move(id, 1)}
                      disabled={enabledIdx === draft.length - 1}
                      className="rounded p-0.5 text-app-fg-muted hover:bg-app-surface disabled:opacity-30"
                      aria-label="Bajar"
                    >
                      <ChevronDown size={14} strokeWidth={2} />
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-center justify-between">
          <button
            onClick={() => setDraft(DEFAULT_DASHBOARD_WIDGETS)}
            className="text-xs font-medium text-app-fg-muted hover:text-app-fg hover:underline"
          >
            Restablecer
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-md border border-app-border px-3 py-1.5 text-sm font-medium text-app-fg hover:bg-app-surface-2"
            >
              Cancelar
            </button>
            <button
              onClick={() => onSave(draft)}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function DashboardWidgets() {
  const [widgets, setWidgets] = useState<string[] | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/dashboard/widgets")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWidgets(sanitizeWidgetList(data?.widgets)))
      .catch(() => setWidgets(DEFAULT_DASHBOARD_WIDGETS));
  }, []);

  async function handleSave(next: string[]) {
    setWidgets(next);
    setPanelOpen(false);
    setSaving(true);
    try {
      await fetch("/api/dashboard/widgets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: next }),
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-app-border px-3 py-1.5 text-xs font-medium text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg"
        >
          <LayoutGrid size={14} strokeWidth={2} />
          Personalizar panel
          {saving && <Spinner label="" className="ml-1" />}
        </button>
      </div>

      {widgets === null ? (
        <Spinner className="p-4" />
      ) : widgets.length === 0 ? (
        <p className="rounded-lg border border-app-border bg-app-surface p-6 text-center text-sm text-app-fg-muted">
          No tienes widgets activos. Usa "Personalizar panel" para agregar algunos.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {widgets.map((id) => {
            const Component = WIDGET_COMPONENTS[id];
            if (!Component) return null;
            return (
              <div key={id} className={WIDGET_SPAN[id] === "full" ? "md:col-span-2" : ""}>
                <Component />
              </div>
            );
          })}
        </div>
      )}

      {panelOpen && (
        <CustomizePanel current={widgets ?? DEFAULT_DASHBOARD_WIDGETS} onClose={() => setPanelOpen(false)} onSave={handleSave} />
      )}
    </div>
  );
}
