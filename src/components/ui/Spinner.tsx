import { Loader2 } from "lucide-react";
import clsx from "clsx";

export function Spinner({ label = "Cargando...", className }: { label?: string; className?: string }) {
  return (
    <div className={clsx("flex items-center gap-2 text-sm text-app-fg-muted", className)}>
      <Loader2 size={15} strokeWidth={2} className="animate-spin" />
      {label}
    </div>
  );
}
