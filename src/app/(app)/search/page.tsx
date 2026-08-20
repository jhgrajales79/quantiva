"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Spinner } from "@/components/ui/Spinner";
import { PageHeader } from "@/components/ui/PageHeader";
import { Table, Thead, Th, Tbody, Tr, Td, TableEmpty } from "@/components/ui/Table";
import { Search } from "lucide-react";

interface SymbolMatch {
  symbol: string;
  name: string;
  assetType: string;
  exchange: string | null;
}

export default function SearchPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SearchResults />
    </Suspense>
  );
}

function SearchResults() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SymbolMatch[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) {
      setResults([]);
      return;
    }
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Dato no disponible");
        return data;
      })
      .then((data) => setResults(data.results))
      .catch((err) => setError(err.message));
  }, [q]);

  return (
    <div className="space-y-4">
      <PageHeader icon={Search} title="Buscar" />
      {!q && <p className="text-sm text-app-fg-muted">Escribe un ticker o nombre en el buscador.</p>}
      {error && <p className="text-sm text-app-fg-muted">Dato no disponible: {error}</p>}
      {results && q && (
        <Table>
          <Thead>
            <Th>Símbolo</Th>
            <Th>Nombre</Th>
            <Th align="right">Bolsa</Th>
          </Thead>
          <Tbody>
            {results.length === 0 ? (
              <TableEmpty colSpan={3}>Sin resultados para &quot;{q}&quot;.</TableEmpty>
            ) : (
              results.map((r) => (
                <Tr key={r.symbol} className="cursor-pointer">
                  <Td>
                    <Link href={`/stocks/${r.symbol}`} className="block font-medium text-app-fg hover:underline">
                      {r.symbol}
                    </Link>
                  </Td>
                  <Td>
                    <Link href={`/stocks/${r.symbol}`} className="block text-app-fg-muted">
                      {r.name}
                    </Link>
                  </Td>
                  <Td align="right">
                    <Link href={`/stocks/${r.symbol}`} className="block text-xs text-app-fg-muted">
                      {r.exchange}
                    </Link>
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      )}
    </div>
  );
}
