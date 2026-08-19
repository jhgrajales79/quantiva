import Link from "next/link";

export function LinkCard({
  href,
  title,
  children,
}: {
  href: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border border-app-border bg-app-surface p-4 transition hover:border-app-border"
    >
      <h3 className="mb-2 text-sm font-semibold text-app-fg">{title}</h3>
      <div className="text-sm text-app-fg-muted">{children}</div>
    </Link>
  );
}
