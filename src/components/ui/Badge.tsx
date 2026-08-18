import clsx from "clsx";

export type BadgeVariant = "success" | "warning" | "danger" | "neutral" | "info";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  success: "bg-emerald-500/15 text-emerald-400",
  warning: "bg-amber-500/15 text-amber-400",
  danger: "bg-red-500/15 text-red-400",
  neutral: "bg-neutral-700/40 text-neutral-400",
  info: "bg-sky-500/15 text-sky-400",
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
        "rounded-full px-2.5 py-1 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
