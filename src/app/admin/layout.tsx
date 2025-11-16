import "../globals.css";
import AdminSidebar from "@/app/components/admin/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-gray-100 overflow-hidden">

      {/* Sidebar Full Height */}
      <AdminSidebar />

      {/* Main Content FIX */}
      <main className="flex-1 p-6 overflow-y-auto h-screen">
        {children}
      </main>

    </div>
  );
}
