"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { useTickerSearch, TickerSuggestions } from "@/components/ui/TickerSearch";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results } = useTickerSearch(open ? query : "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex-1 max-w-md">
      <Search
        size={15}
        strokeWidth={2}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-app-fg-muted"
      />
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        type="search"
        placeholder="Buscar ticker, empresa..."
        className="w-full rounded-md border border-app-border bg-app-surface py-1.5 pl-8 pr-3 text-sm text-app-fg outline-none placeholder:text-app-fg-muted focus:border-emerald-500"
      />
      {open && (
        <TickerSuggestions
          results={results}
          onSelect={(match) => {
            setQuery("");
            setOpen(false);
            router.push(`/stocks/${match.symbol}`);
          }}
        />
      )}
    </form>
  );
}
