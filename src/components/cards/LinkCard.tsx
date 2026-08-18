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
      className="block rounded-lg border border-neutral-800 bg-neutral-900 p-4 transition hover:border-neutral-700"
    >
      <h3 className="mb-2 text-sm font-semibold text-neutral-200">{title}</h3>
      <div className="text-sm text-neutral-400">{children}</div>
    </Link>
  );
}
