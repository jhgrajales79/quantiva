import clsx from "clsx";
import Link from "next/link";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  deltaLabel,
  deltaPositive,
  href,
  extra,
}: {
  label: string;
  value: React.ReactNode;
  deltaLabel?: React.ReactNode;
  deltaPositive?: boolean | null;
  href?: string;
  extra?: React.ReactNode;
}) {
  const content = (
    <Card className={clsx(href && "transition hover:border-app-border")}>
      <p className="text-xs text-app-fg-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold tabular-nums text-app-fg">{value}</p>
      {deltaLabel !== undefined && (
        <p
          className={clsx(
            "text-sm tabular-nums",
            deltaPositive === null || deltaPositive === undefined
              ? "text-app-fg-muted"
              : deltaPositive
                ? "text-positive"
                : "text-negative",
          )}
        >
          {deltaLabel}
        </p>
      )}
      {extra}
    </Card>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
