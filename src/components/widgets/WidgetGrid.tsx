"use client";

import { useEffect, useState } from "react";
import ReactGridLayout, { useContainerWidth, type Layout } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import { LayoutGrid, GripVertical, StretchHorizontal } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { WidgetCustomizePanel, type WidgetDef } from "@/components/widgets/WidgetCustomizePanel";
import { generateDefaultLayout, GRID_COLS, type GridLayoutItem } from "@/lib/widget-list";

interface WidgetGridDef extends WidgetDef {
  span: "half" | "full";
  defaultH: number;
}

const ROW_HEIGHT = 32;
const MARGIN: [number, number] = [16, 16];

export function WidgetGrid({
  apiPath,
  buttonLabel,
  panelTitle,
  panelDescription,
  emptyMessage,
  defs,
  defaultIds,
  sanitizeList,
  sanitizeLayout,
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
  sanitizeLayout: (input: unknown) => GridLayoutItem[];
  renderWidget: (id: string) => React.ReactNode;
}) {
  const { width, containerRef, mounted } = useContainerWidth();
  const [widgets, setWidgets] = useState<string[] | null>(null);
  const [layout, setLayout] = useState<GridLayoutItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(apiPath)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const nextWidgets = sanitizeList(data?.widgets);
        const savedLayout = sanitizeLayout(data?.layout).filter((item) => nextWidgets.includes(item.i));
        const missingIds = nextWidgets.filter((id) => !savedLayout.some((item) => item.i === id));
        const filledLayout =
          missingIds.length > 0
            ? [...savedLayout, ...generateDefaultLayout(defs, missingIds)]
            : savedLayout;
        setWidgets(nextWidgets);
        setLayout(filledLayout.length > 0 ? filledLayout : generateDefaultLayout(defs, nextWidgets));
      })
      .catch(() => setWidgets(defaultIds));
    // defs/defaultIds/sanitize* son estables por página, no cambian en runtime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiPath]);

  async function persist(nextWidgets: string[], nextLayout: GridLayoutItem[]) {
    setSaving(true);
    try {
      await fetch(apiPath, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: nextWidgets, layout: nextLayout }),
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(next: string[]) {
    const keptLayout = layout.filter((item) => next.includes(item.i));
    const newIds = next.filter((id) => !keptLayout.some((item) => item.i === id));
    const stackY = keptLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    const newItems = generateDefaultLayout(defs, newIds).map((item) => ({ ...item, y: item.y + stackY }));
    const nextLayout = [...keptLayout, ...newItems];
    setWidgets(next);
    setLayout(nextLayout);
    setPanelOpen(false);
    await persist(next, nextLayout);
  }

  function handleLayoutChange(next: Layout) {
    setLayout(next as GridLayoutItem[]);
  }

  function handleInteractionStop(next: Layout) {
    const nextLayout = next as GridLayoutItem[];
    setLayout(nextLayout);
    persist(widgets ?? defaultIds, nextLayout);
  }

  function handleUseFullWidth(id: string) {
    const nextLayout = layout.map((item) => (item.i === id ? { ...item, x: 0, w: GRID_COLS } : item));
    setLayout(nextLayout);
    persist(widgets ?? defaultIds, nextLayout);
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
        <div ref={containerRef}>
          {mounted && layout.length === widgets.length && (
            <ReactGridLayout
              layout={layout}
              width={width}
              gridConfig={{ cols: GRID_COLS, rowHeight: ROW_HEIGHT, margin: MARGIN }}
              dragConfig={{ handle: ".widget-drag-handle" }}
              resizeConfig={{ handles: ["se"] }}
              className="quantiva-widget-grid"
              onLayoutChange={handleLayoutChange}
              onDragStop={handleInteractionStop}
              onResizeStop={handleInteractionStop}
            >
              {widgets.map((id) => (
                <div key={id} id={`widget-${id}`} className="group relative h-full">
                  <div
                    className="widget-drag-handle absolute left-2 top-2 z-10 flex cursor-move items-center gap-1 rounded-md bg-app-surface-2/90 px-2 py-1.5 text-app-fg-muted opacity-60 shadow-sm transition hover:bg-app-surface-2 hover:text-app-fg hover:opacity-100 group-hover:opacity-100"
                    title="Arrastrar para mover"
                  >
                    <GripVertical size={16} strokeWidth={2} />
                  </div>
                  <button
                    onClick={() => handleUseFullWidth(id)}
                    className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-app-surface-2/90 px-2 py-1.5 text-app-fg-muted opacity-60 shadow-sm transition hover:bg-app-surface-2 hover:text-app-fg hover:opacity-100 group-hover:opacity-100"
                    title="Usar todo el ancho de la pantalla"
                  >
                    <StretchHorizontal size={16} strokeWidth={2} />
                  </button>
                  <div className="h-full overflow-auto">{renderWidget(id)}</div>
                </div>
              ))}
            </ReactGridLayout>
          )}
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
