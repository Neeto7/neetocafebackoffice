"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type UserProfile = {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
};

export default function CashierProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImg, setSelectedImg] = useState<File | null>(null);
  const [previewImg, setPreviewImg] = useState<string | null>(null);

  const loadUser = useCallback(async () => {
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session.session?.access_token;

      if (!token) {
        toast.error("Tidak ada session login");
        return;
      }

      const res = await fetch("/api/cashier/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Gagal load profile");
        return;
      }

      setUser(result.user);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const saveProfile = async () => {
    if (!user) return;

    const { data: session } = await supabase.auth.getSession();
    const token = session.session?.access_token;

    const form = new FormData();
    form.append("name", user.name);
    form.append("email", user.email);

    if (selectedImg) form.append("avatar", selectedImg);

    const res = await fetch("/api/cashier/profile", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });

    const result = await res.json();

    if (!res.ok) {
      toast.error(result.error || "Gagal update");
      return;
    }

    toast.success("Berhasil disimpan");
    loadUser();
  };

  if (loading) return <p>Memuat...</p>;
  if (!user) return <p>User tidak ditemukan</p>;

  return (
    <div className="p-6 space-y-4 max-w-lg mx-auto">
      <h1 className="text-xl font-bold">Profil Cashier</h1>

      <img
        src={previewImg || user.avatar_url || "/default-avatar.png"}
        className="w-28 h-28 rounded-full border object-cover"
      />

      <Input
        type="file"
        accept="image/*"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setSelectedImg(f);
          setPreviewImg(URL.createObjectURL(f));
        }}
      />

      <Label>Nama</Label>
      <Input
        value={user.name}
        onChange={(e) => setUser({ ...user, name: e.target.value })}
      />

      <Label>Email</Label>
      <Input
        value={user.email}
        onChange={(e) => setUser({ ...user, email: e.target.value })}
      />

      <Button className="w-full" onClick={saveProfile}>
        Simpan
      </Button>
    </div>
  );
}
