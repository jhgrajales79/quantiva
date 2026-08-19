"use client";

import { useEffect, useState } from "react";
import { LayoutGrid, Maximize2, Minimize2 } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { WidgetCustomizePanel, type WidgetDef } from "@/components/widgets/WidgetCustomizePanel";
import type { WidgetSize } from "@/lib/widget-list";

interface WidgetGridDef extends WidgetDef {
  span: WidgetSize;
}

export function WidgetGrid({
  apiPath,
  buttonLabel,
  panelTitle,
  panelDescription,
  emptyMessage,
  defs,
  defaultIds,
  sanitizeList,
  sanitizeSizes,
  gridClassName,
  fullSpanClassName,
  renderWidget,
}: {
  apiPath: string;
  buttonLabel: string;
  panelTitle: string;
  panelDescription: string;
  emptyMessage: string;
  defs: WidgetGridDef[];
  defaultIds: string[];
  sanitizeList: (input: unknown) => string[];
  sanitizeSizes: (input: unknown) => Record<string, WidgetSize>;
  gridClassName: string;
  fullSpanClassName: string;
  renderWidget: (id: string) => React.ReactNode;
}) {
  const [widgets, setWidgets] = useState<string[] | null>(null);
  const [sizes, setSizes] = useState<Record<string, WidgetSize>>({});
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(apiPath)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        setWidgets(sanitizeList(data?.widgets));
        setSizes(sanitizeSizes(data?.sizes));
      })
      .catch(() => setWidgets(defaultIds));
    // defs/defaultIds/sanitize* son estables por página, no cambian en runtime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  async function persist(nextWidgets: string[], nextSizes: Record<string, WidgetSize>) {
    setSaving(true);
    try {
      await fetch(apiPath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: nextWidgets, sizes: nextSizes }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(next: string[]) {
    setWidgets(next);
    setPanelOpen(false);
    await persist(next, sizes);
  }

  function toggleSize(id: string, defaultSpan: WidgetSize) {
    const current = sizes[id] ?? defaultSpan;
    const next: WidgetSize = current === "full" ? "half" : "full";
    const nextSizes = { ...sizes, [id]: next };
    setSizes(nextSizes);
    persist(widgets ?? defaultIds, nextSizes);
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setPanelOpen(true)}
          className="flex items-center gap-1.5 rounded-md border border-app-border px-3 py-1.5 text-xs font-medium text-app-fg-muted hover:bg-app-surface-2 hover:text-app-fg"
        >
          <LayoutGrid size={14} strokeWidth={2} />
          {buttonLabel}
          {saving && <Spinner label="" className="ml-1" />}
        </button>
      </div>

      {widgets === null ? (
        <Spinner className="p-4" />
      ) : widgets.length === 0 ? (
        <p className="rounded-lg border border-app-border bg-app-surface p-6 text-center text-sm text-app-fg-muted">
          {emptyMessage}
        </p>
      ) : (
        <div className={`grid gap-4 ${gridClassName}`}>
          {widgets.map((id) => {
            const def = defs.find((d) => d.id === id);
            if (!def) return null;
            const size = sizes[id] ?? def.span;
            return (
              <div
                key={id}
                id={`widget-${id}`}
                className={`group relative ${size === "full" ? fullSpanClassName : ""}`}
              >
                <button
                  onClick={() => toggleSize(id, def.span)}
                  aria-label={size === "full" ? "Reducir widget" : "Ampliar widget"}
                  title={size === "full" ? "Reducir" : "Ampliar"}
                  className="absolute right-2 top-2 z-10 rounded-md bg-app-surface/80 p-1 text-app-fg-faint opacity-0 transition group-hover:opacity-100 hover:bg-app-surface-2 hover:text-app-fg"
                >
                  {size === "full" ? (
                    <Minimize2 size={14} strokeWidth={2} />
                  ) : (
                    <Maximize2 size={14} strokeWidth={2} />
                  )}
                </button>
                {renderWidget(id)}
              </div>
            );
          })}
        </div>
      )}

      {panelOpen && (
        <WidgetCustomizePanel
          title={panelTitle}
          description={panelDescription}
          defs={defs}
          current={widgets ?? defaultIds}
          defaultIds={defaultIds}
          onClose={() => setPanelOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
