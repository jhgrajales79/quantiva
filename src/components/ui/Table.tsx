import clsx from "clsx";
import { ChevronDown, ChevronUp } from "lucide-react";

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "overflow-x-auto rounded-card border border-app-border bg-app-surface shadow-card",
        className,
      )}
    >
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return (
    <thead>
      <tr className="border-b border-app-border text-left text-xs text-app-fg-muted">{children}</tr>
    </thead>
  );
}

export function Th({
  children,
  sortable,
  active,
  direction,
  onClick,
  align = "left",
  className,
}: {
  children?: React.ReactNode;
  sortable?: boolean;
  active?: boolean;
  direction?: "asc" | "desc";
  onClick?: () => void;
  align?: "left" | "right";
  className?: string;
}) {
  return (
    <th
      className={clsx(
        "px-3 py-2 font-medium",
        align === "right" && "text-right",
        sortable && "cursor-pointer select-none hover:text-app-fg",
        className,
      )}
      onClick={onClick}
      aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : undefined}
    >
      <span className={clsx("inline-flex items-center gap-1", align === "right" && "flex-row-reverse")}>
        {children}
        {sortable && active && (direction === "asc" ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
      </span>
    </th>
  );
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-app-border">{children}</tbody>;
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      className={clsx(
        "transition-colors hover:bg-app-surface-2/60",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function Td({
  children,
  className,
  align = "left",
}: {
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}) {
  return (
    <td className={clsx("px-3 py-2 tabular-nums", align === "right" && "text-right", className)}>
      {children}
    </td>
  );
}

export function TableEmpty({ colSpan, children }: { colSpan: number; children: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-app-fg-muted">
        {children}
      </td>
    </tr>
  );
}
