"use client";

import { useState } from "react";
import { X, GripVertical, ChevronUp, ChevronDown } from "lucide-react";

export interface WidgetDef {
  id: string;
  label: string;
  description: string;
}

export function WidgetCustomizePanel({
  title,
  description,
  defs,
  current,
  defaultIds,
  onClose,
  onSave,
}: {
  title: string;
  description: string;
  defs: WidgetDef[];
  current: string[];
  defaultIds: string[];
  onClose: () => void;
  onSave: (widgets: string[]) => void;
}) {
  const [draft, setDraft] = useState<string[]>(current);

  const enabledSet = new Set(draft);
  const ordered = [...draft, ...defs.map((w) => w.id).filter((id) => !enabledSet.has(id))];

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
          <h3 className="text-lg font-semibold text-app-fg">{title}</h3>
          <button onClick={onClose} className="rounded-md p-1 text-app-fg-muted hover:bg-app-surface-2">
            <X size={18} strokeWidth={2} />
          </button>
        </div>
        <p className="mb-4 text-sm text-app-fg-muted">{description}</p>

        <ul className="space-y-1.5">
          {ordered.map((id) => {
            const def = defs.find((w) => w.id === id);
            if (!def) return null;
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
            onClick={() => setDraft(defaultIds)}
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
