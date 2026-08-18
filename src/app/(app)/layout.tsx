import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { Disclaimer } from "@/components/layout/Disclaimer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 overflow-x-hidden p-4 md:p-6">{children}</main>
      </div>
      <Disclaimer />
    </div>
  );
}
