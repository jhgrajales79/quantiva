"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex-1 max-w-md">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        type="search"
        placeholder="Buscar ticker, empresa..."
        className="w-full rounded-md border border-app-border bg-app-surface px-3 py-1.5 text-sm text-app-fg outline-none placeholder:text-app-fg-muted focus:border-emerald-500"
      />
    </form>
  );
}
