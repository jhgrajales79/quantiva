import clsx from "clsx";

export type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-positive/15 text-positive",
  warning: "bg-warning/15 text-warning",
  danger: "bg-negative/15 text-negative",
  neutral: "bg-app-surface-2 text-app-fg-muted",
  info: "bg-info/15 text-info",
};

export function Badge({
  children,
  variant = "neutral",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "rounded-pill px-2.5 py-1 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
