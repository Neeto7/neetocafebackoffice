"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const menu = [
  { name: "Cashier", path: "/cashier" },
  { name: "Order History", path: "/cashier/orderhistory" },
  { name: "Profile", path: "/cashier/profile" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] bg-[#0A213C] text-white min-h-screen p-5 flex flex-col gap-4">
      <h1 className="text-xl font-bold mb-6">NeetoCafe</h1>

      {menu.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={cn(
            "p-3 rounded-lg block",
            pathname === item.path || pathname.startsWith(item.path)
              ? "bg-white text-[#0A213C] font-bold"
              : "text-gray-300 hover:bg-[#123459]"
          )}
        >
          {item.name}
        </Link>
      ))}
    </aside>
  );
}
