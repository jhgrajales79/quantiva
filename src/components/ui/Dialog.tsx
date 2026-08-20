"use client";

import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import clsx from "clsx";

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="qv-fade fixed inset-0 z-50 bg-black/50" />
        <RadixDialog.Content
          className={clsx(
            "qv-pop fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2",
            "rounded-card border border-app-border bg-app-surface p-5 shadow-popover",
            className,
          )}
        >
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <RadixDialog.Title className="text-base font-semibold text-app-fg">{title}</RadixDialog.Title>
              {description && (
                <RadixDialog.Description className="mt-1 text-sm text-app-fg-muted">
                  {description}
                </RadixDialog.Description>
              )}
            </div>
            <RadixDialog.Close className="shrink-0 rounded-md p-1 text-app-fg-muted transition-colors hover:bg-app-surface-2 hover:text-app-fg">
              <X size={16} strokeWidth={2} />
            </RadixDialog.Close>
          </div>
          {children}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
