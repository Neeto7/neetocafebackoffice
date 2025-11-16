import Sidebar from "@/app/components/cashier/Sidebar";
import { Toaster } from "@/components/ui/sonner";

export default function CashierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0C2B4E] text-white">
      {/* Sidebar di kiri */}
      <Sidebar />

      {/* Konten utama di kanan */}
      <main className="flex-1 bg-white text-black p-6">
        {children}
        <Toaster richColors position="top-right"/>
      </main>
    </div>
  );
}
