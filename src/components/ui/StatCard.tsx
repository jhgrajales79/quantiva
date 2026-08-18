import clsx from "clsx";
import Link from "next/link";
import { Card } from "./Card";

export function StatCard({
  label,
  value,
  deltaLabel,
  deltaPositive,
  href,
}: {
  label: string;
  value: React.ReactNode;
  deltaLabel?: React.ReactNode;
  deltaPositive?: boolean | null;
  href?: string;
}) {
  const content = (
    <Card className={clsx(href && "transition hover:border-neutral-700")}>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-neutral-50">{value}</p>
      {deltaLabel !== undefined && (
        <p
          className={clsx(
            "text-sm",
            deltaPositive === null || deltaPositive === undefined
              ? "text-neutral-500"
              : deltaPositive
                ? "text-emerald-400"
                : "text-red-400",
          )}
        >
          {deltaLabel}
        </p>
      )}
    </Card>
  );

  if (!href) return content;

  return (
    <Link href={href} className="block">
      {content}
    </Link>
  );
}
