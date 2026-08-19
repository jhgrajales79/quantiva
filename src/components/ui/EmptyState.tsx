import Link from "next/link";
import { Inbox, ArrowRight, type LucideIcon } from "lucide-react";

export function EmptyState({
  message,
  ctaLabel,
  ctaHref,
  icon: Icon = Inbox,
}: {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
  icon?: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-center">
      <Icon size={28} strokeWidth={1.5} className="text-app-fg-faint" />
      <p className="max-w-sm text-sm text-app-fg-muted">{message}</p>
      {ctaLabel && ctaHref && (
        <Link
          href={ctaHref}
          className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-emerald-400 hover:underline"
        >
          {ctaLabel}
          <ArrowRight size={14} strokeWidth={2} />
        </Link>
      )}
    </div>
  );
}
