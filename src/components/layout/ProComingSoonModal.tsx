"use client";

import { Dialog } from "@/components/ui/Dialog";

export function ProComingSoonModal({
  open,
  onClose,
  message,
}: {
  open: boolean;
  onClose: () => void;
  message?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()} title="Quantiva PRO">
      <p className="text-sm text-app-fg-muted">
        {message ??
          "Los planes de suscripción (Screener avanzado, ETFs, Comparador, alertas y más) estarán disponibles próximamente. Por ahora, todas las funciones están abiertas mientras seguimos construyendo la plataforma."}
      </p>
      <button
        onClick={onClose}
        className="mt-4 w-full rounded-md bg-app-surface-2 px-3 py-2 text-sm font-medium text-app-fg transition-colors hover:bg-app-border"
      >
        Entendido
      </button>
    </Dialog>
  );
}
