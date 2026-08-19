import { Header } from "@/components/layout/Header";
import { TopNav } from "@/components/layout/TopNav";
import { Disclaimer } from "@/components/layout/Disclaimer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <TopNav />
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-[1440px] p-4 md:p-6">{children}</div>
      </main>
      <Disclaimer />
    </div>
  );
}
