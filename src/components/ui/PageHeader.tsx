import clsx from "clsx";
import type { LucideIcon } from "lucide-react";

export function PageHeader({
  title,
  description,
  action,
  icon: Icon,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div className={clsx("flex flex-wrap items-start justify-between gap-3", className)}>
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold text-app-fg">
          {Icon && <Icon size={20} strokeWidth={2} className="text-app-fg-muted" />}
          {title}
        </h1>
        {description && <p className="mt-1 text-sm text-app-fg-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
