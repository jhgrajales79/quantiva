"use client";

import * as RadixTooltip from "@radix-ui/react-tooltip";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <RadixTooltip.Provider delayDuration={200}>{children}</RadixTooltip.Provider>;
}

export function Tooltip({
  content,
  children,
  side = "top",
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
}) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-xs rounded-md border border-app-border bg-app-surface px-2.5 py-1.5 text-xs text-app-fg shadow-popover"
        >
          {content}
          <RadixTooltip.Arrow className="fill-app-surface" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
