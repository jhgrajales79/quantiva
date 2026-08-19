"use client";

import { useEffect, useState } from "react";
import { Building2 } from "lucide-react";

function domainFromWebsite(website: string): string | null {
  try {
    const url = new URL(website.startsWith("http") ? website : `https://${website}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function CompanyLogo({ symbol, size = 32 }: { symbol: string; size?: number }) {
  const [domain, setDomain] = useState<string | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    fetch(`/api/company-profile/${symbol}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setDomain(data?.website ? domainFromWebsite(data.website) : null))
      .catch(() => setDomain(null));
  }, [symbol]);

  const showFallback = !domain || failed;

  return (
    <div
      className="flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-app-border bg-app-surface-2"
      style={{ width: size, height: size }}
    >
      {showFallback ? (
        <Building2 size={size * 0.55} strokeWidth={1.5} className="text-app-fg-faint" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`https://www.google.com/s2/favicons?sz=${Math.max(64, size * 2)}&domain=${domain}`}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-contain p-1"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}
