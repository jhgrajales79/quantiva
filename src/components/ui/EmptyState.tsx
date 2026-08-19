import Link from "next/link";

export function EmptyState({
  message,
  ctaLabel,
  ctaHref,
}: {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="py-2">
      <p className="text-sm text-app-fg-muted">{message}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-3 inline-flex items-center gap-1 text-sm text-emerald-400 hover:underline"
        >
          {ctaLabel} →
        </Link>
      )}
    </div>
  );
}
