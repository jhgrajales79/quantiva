"use client";

export function ProComingSoonModal({ onClose, message }: { onClose: () => void; message?: string }) {
  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-lg border border-app-border bg-app-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-app-fg">Quantiva PRO</h3>
        <p className="mt-2 text-sm text-app-fg-muted">
          {message ??
            "Los planes de suscripción (Screener avanzado, ETFs, Comparador, alertas y más) estarán disponibles próximamente. Por ahora, todas las funciones están abiertas mientras seguimos construyendo la plataforma."}
        </p>
        <button
          onClick={onClose}
          className="mt-4 w-full rounded-md bg-app-surface-2 px-3 py-2 text-sm font-medium text-app-fg hover:bg-app-border"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
