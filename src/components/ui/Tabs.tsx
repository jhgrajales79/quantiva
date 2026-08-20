"use client";

import * as RadixTabs from "@radix-ui/react-tabs";
import clsx from "clsx";

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixTabs.Root defaultValue={defaultValue} value={value} onValueChange={onValueChange} className={className}>
      {children}
    </RadixTabs.Root>
  );
}

export function TabsList({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <RadixTabs.List
      className={clsx(
        "inline-flex gap-1 rounded-card border border-app-border bg-app-surface p-1",
        className,
      )}
    >
      {children}
    </RadixTabs.List>
  );
}

export function TabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  return (
    <RadixTabs.Trigger
      value={value}
      className={clsx(
        "rounded-md px-3 py-1.5 text-sm font-medium text-app-fg-muted transition-colors",
        "hover:text-app-fg",
        "data-[state=active]:bg-app-surface-2 data-[state=active]:text-app-fg",
      )}
    >
      {children}
    </RadixTabs.Trigger>
  );
}

export function TabsContent({
  value,
  children,
  className,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixTabs.Content value={value} className={clsx("mt-3", className)}>
      {children}
    </RadixTabs.Content>
  );
}
