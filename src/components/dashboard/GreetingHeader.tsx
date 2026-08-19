import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/Badge";
import { MarketStatusBadge } from "@/components/layout/MarketStatusBadge";
import { GreetingText } from "./GreetingText";

export async function GreetingHeader() {
  const session = await auth();
  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-500">Tu panel</p>
        <h1 className="text-2xl font-semibold text-app-fg">
          <GreetingText firstName={firstName} />
        </h1>
        <p className="text-sm text-app-fg-muted">Esto cambió en tus acciones mientras no mirabas.</p>
      </div>
      <div className="flex items-center gap-2">
        <MarketStatusBadge />
        <Badge variant="success">Datos en vivo</Badge>
      </div>
    </div>
  );
}
