"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { ProComingSoonModal } from "./ProComingSoonModal";

export function UpgradeProButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-md bg-warning px-3 py-1.5 text-xs font-semibold text-neutral-950 transition-opacity hover:opacity-90"
      >
        <Sparkles size={14} strokeWidth={2.5} />
        Hazte PRO
      </button>
      <ProComingSoonModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
