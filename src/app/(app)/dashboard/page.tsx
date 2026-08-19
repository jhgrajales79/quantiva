import { GreetingHeader } from "@/components/dashboard/GreetingHeader";
import { DashboardWidgets } from "@/components/dashboard/DashboardWidgets";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <GreetingHeader />
      <DashboardWidgets />
    </div>
  );
}
