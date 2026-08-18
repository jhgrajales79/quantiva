import { StockPageClient } from "./StockPageClient";

export default async function StockPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol } = await params;
  return <StockPageClient symbol={symbol.toUpperCase()} />;
}
