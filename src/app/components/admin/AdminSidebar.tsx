"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function AdminSidebar() {
  const path = usePathname();

  const links = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/reports", label: "reports" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/orderhistory", label: "Order History" },
  ];

  return (
    <aside className="w-64 h-screen bg-[#0C2B4E] text-white p-5 flex flex-col gap-4">
      <h1 className="text-xl font-bold">Admin Panel</h1>

      <nav className="flex flex-col gap-2">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "p-2 rounded-lg text-sm transition",
              path === item.href ? "bg-white text-[#0C2B4E] font-semibold" : "hover:bg-white/20"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </aside>
  );
}
