"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import ReactGridLayout, { type Layout, type ResizeHandleAxis } from "react-grid-layout";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";
import clsx from "clsx";
import { LayoutGrid, GripVertical, GripHorizontal, MoveDiagonal2, StretchHorizontal } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { WidgetCustomizePanel, type WidgetDef, type WidthChoice } from "@/components/widgets/WidgetCustomizePanel";
import { generateDefaultLayout, GRID_COLS, type GridLayoutItem } from "@/lib/widget-list";

function applyWidthChoice(item: GridLayoutItem, choice: WidthChoice): GridLayoutItem {
  if (choice === "full") return { ...item, x: 0, w: GRID_COLS };
  const half = GRID_COLS / 2;
  return { ...item, w: half, x: Math.min(item.x, GRID_COLS - half) };
}

interface WidgetGridDef extends WidgetDef {
  span: "half" | "full";
  defaultH: number;
}

const ROW_HEIGHT = 32;
const MARGIN: [number, number] = [16, 16];

// Manijas de resize visibles y fáciles de encontrar (las de react-resizable
// por defecto son un ícono SVG minúsculo casi invisible sobre el fondo
// oscuro): una barra con grip para ancho ("e"/"w"), otra para alto ("s") —
// que es la que permite "estirar" el widget verticalmente — y un ícono de
// esquina para "se"/"sw" (ancho + alto a la vez).
const RESIZE_HANDLE_POSITION: Record<string, string> = {
  e: "right-1 top-1/2 h-9 w-4 -translate-y-1/2 cursor-ew-resize",
  w: "left-1 top-1/2 h-9 w-4 -translate-y-1/2 cursor-ew-resize",
  s: "bottom-1 left-1/2 h-4 w-9 -translate-x-1/2 cursor-ns-resize",
  se: "bottom-1 right-1 h-5 w-5 cursor-nwse-resize",
  sw: "bottom-1 left-1 h-5 w-5 cursor-nesw-resize",
};

function renderResizeHandle(axis: ResizeHandleAxis, ref: React.Ref<HTMLElement>) {
  const isCorner = axis === "se" || axis === "sw";
  const Icon = axis === "s" ? GripHorizontal : isCorner ? MoveDiagonal2 : GripVertical;
  return (
    <span
      ref={ref as React.Ref<HTMLSpanElement>}
      className={clsx(
        // Oculto en reposo — solo aparece al pasar el mouse sobre el widget
        // (o al enfocar la manija con teclado), para no saturar la vista con
        // marcadores permanentes sobre cada widget.
        "absolute z-30 flex items-center justify-center rounded-md bg-app-surface-2/90 text-app-fg-muted opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-app-surface-2 hover:text-app-fg hover:opacity-100 focus-visible:opacity-100",
        RESIZE_HANDLE_POSITION[axis],
      )}
    >
      <Icon size={12} strokeWidth={2.5} />
    </span>
  );
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
  // Medición propia del ancho del contenedor con ResizeObserver — el hook
  // useContainerWidth de react-grid-layout se queda pegado en su
  // initialWidth por defecto (1280) en esta app y nunca se corrige con el
  // ancho real, lo que hacía que "ancho completo" no llegara a ocupar el
  // 100% del contenedor real ni la cuadrícula de fondo coincidiera con los
  // widgets.
  const [width, setWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  // Ref callback en vez de useRef+useEffect: el contenedor solo existe en el
  // DOM una vez que `widgets` termina de cargar (antes se muestra un
  // Spinner), así que un useEffect con deps [] que corre justo después del
  // primer render nunca vería el nodo real. El callback ref, en cambio, se
  // ejecuta cada vez que React monta/desmonta el nodo, sin importar en qué
  // render ocurra.
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    resizeObserverRef.current?.disconnect();
    resizeObserverRef.current = null;
    if (!node) return;
    setWidth(Math.round(node.getBoundingClientRect().width));
    setMounted(true);
    const observer = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setWidth(Math.round(w));
    });
    observer.observe(node);
    resizeObserverRef.current = observer;
  }, []);

  const [widgets, setWidgets] = useState<string[] | null>(null);
  const [layout, setLayout] = useState<GridLayoutItem[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  // Resalta la cuadrícula de fondo mientras el usuario arrastra o
  // redimensiona un widget, como guía visual de alineación.
  const [interacting, setInteracting] = useState(false);
  // ReactGridLayout solo lee `layout` como valor inicial al montar — no lo
  // vuelve a aplicar si cambia por una actualización externa (como el botón
  // "usar todo el ancho" o agregar/quitar widgets desde "Personalizar"), a
  // diferencia del arrastre/resize nativo que sí actualiza la grilla en
  // vivo. Por eso esos cambios programáticos, además de actualizar el
  // estado, incrementan esta versión para forzar el remount de la grilla.
  const [layoutVersion, setLayoutVersion] = useState(0);

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

  async function handleSave(next: string[], widthChoices: Record<string, WidthChoice>) {
    const keptLayout = layout
      .filter((item) => next.includes(item.i))
      .map((item) => (widthChoices[item.i] ? applyWidthChoice(item, widthChoices[item.i]) : item));
    const newIds = next.filter((id) => !keptLayout.some((item) => item.i === id));
    const stackY = keptLayout.reduce((max, item) => Math.max(max, item.y + item.h), 0);
    const newItems = generateDefaultLayout(defs, newIds).map((item) => {
      const stacked = { ...item, y: item.y + stackY };
      return widthChoices[item.i] ? applyWidthChoice(stacked, widthChoices[item.i]) : stacked;
    });
    const nextLayout = [...keptLayout, ...newItems];
    setWidgets(next);
    setLayout(nextLayout);
    setLayoutVersion((v) => v + 1);
    setPanelOpen(false);
    await persist(next, nextLayout);
  }

  function handleLayoutChange(next: Layout) {
    setLayout(next as GridLayoutItem[]);
  }

  function handleInteractionStart() {
    setInteracting(true);
  }

  function handleInteractionStop(next: Layout) {
    const nextLayout = next as GridLayoutItem[];
    setLayout(nextLayout);
    setInteracting(false);
    persist(widgets ?? defaultIds, nextLayout);
  }

  function handleUseFullWidth(id: string) {
    const nextLayout = layout.map((item) => (item.i === id ? { ...item, x: 0, w: GRID_COLS } : item));
    setLayout(nextLayout);
    setLayoutVersion((v) => v + 1);
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
        <p className="rounded-card border border-app-border bg-app-surface p-6 text-center text-sm text-app-fg-muted">
          {emptyMessage}
        </p>
      ) : (
        <div ref={containerRef} className="relative">
          {mounted && width > 0 && (
            <div
              aria-hidden
              className={`quantiva-widget-grid-lines pointer-events-none absolute inset-0 z-0${
                interacting ? " is-interacting" : ""
              }`}
              style={{
                backgroundImage:
                  "linear-gradient(to right, var(--color-app-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-app-border) 1px, transparent 1px)",
                // Debe coincidir exactamente con calcGridColWidth de react-grid-layout:
                // colWidth = (containerWidth - margin*(cols-1) - containerPadding*2) / cols.
                // containerPadding se fuerza a [0,0] más abajo (ver gridConfig), así que
                // aquí también se usa 0 en vez de asumir que containerPadding = margin.
                backgroundSize: `${(width - MARGIN[0] * (GRID_COLS - 1)) / GRID_COLS + MARGIN[0]}px ${
                  ROW_HEIGHT + MARGIN[1]
                }px`,
                backgroundPosition: "0px 0px",
              }}
            />
          )}
          {mounted && layout.length === widgets.length && (
            <ReactGridLayout
              key={layoutVersion}
              layout={layout}
              width={width}
              gridConfig={{
                cols: GRID_COLS,
                rowHeight: ROW_HEIGHT,
                margin: MARGIN,
                // Sin esto, react-grid-layout usa el margen como padding del
                // contenedor por defecto, dejando un hueco a cada lado y
                // haciendo que "ancho completo" (w = GRID_COLS) nunca llegue
                // a tocar los bordes reales del contenedor.
                containerPadding: [0, 0],
              }}
              dragConfig={{ handle: ".widget-drag-handle" }}
              resizeConfig={{ handles: ["e", "w", "s", "se", "sw"], handleComponent: renderResizeHandle }}
              className="quantiva-widget-grid relative z-10"
              onLayoutChange={handleLayoutChange}
              onDragStart={handleInteractionStart}
              onDragStop={handleInteractionStop}
              onResizeStart={handleInteractionStart}
              onResizeStop={handleInteractionStop}
            >
              {widgets.map((id) => (
                <div key={id} id={`widget-${id}`} className="group relative h-full">
                  <div
                    className="widget-drag-handle absolute left-2 top-2 z-10 flex cursor-move items-center gap-1 rounded-md bg-app-surface-2/90 px-2 py-1.5 text-app-fg-muted opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-app-surface-2 hover:text-app-fg hover:opacity-100"
                    title="Arrastrar para mover"
                  >
                    <GripVertical size={16} strokeWidth={2} />
                  </div>
                  <button
                    onClick={() => handleUseFullWidth(id)}
                    className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md bg-app-surface-2/90 px-2 py-1.5 text-app-fg-muted opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-app-surface-2 hover:text-app-fg hover:opacity-100"
                    title="Usar todo el ancho de la pantalla"
                  >
                    <StretchHorizontal size={16} strokeWidth={2} />
                  </button>
                  {/* display:grid con un solo hijo lo estira automáticamente
                      para llenar el alto/ancho de la celda (comportamiento
                      "stretch" por defecto de grid) — así la tarjeta del
                      widget siempre ocupa todo el espacio que el usuario le
                      asignó al redimensionar, en vez de quedar más corta que
                      la celda y dejar ver la cuadrícula de fondo debajo. */}
                  <div className="grid h-full overflow-auto">{renderWidget(id)}</div>
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
          layout={layout}
          onClose={() => setPanelOpen(false)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
