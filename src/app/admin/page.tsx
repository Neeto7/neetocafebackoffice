"use client";

import AdminProfile from "@/app/components/admin/AdminProfile";
import MenuManager from "@/app/components/admin/MenuManager";
import AdminMenuCard from "../components/admin/MenuCard";

export default function AdminPage() {
  return (
    <>
      <div className="mb-6">
        <AdminProfile />
      </div>

      <MenuManager />

      <AdminMenuCard />
    </>
  );
}
