"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { User } from "@/types/User";

export default function AdminProfile() {
  const [admin, setAdmin] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: "", email: "" });

  useEffect(() => {
    const fetchAdmin = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("role", "admin")
        .single();

      if (!error && data) {
        setAdmin(data);
        setForm({ name: data.name, email: data.email });
      }
      setLoading(false);
    };
    fetchAdmin();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setAvatarFile(e.target.files[0]);
  };

  const handleSave = async () => {
    if (!admin) return;
    setSaving(true);

    try {
      let image_url = admin.image_url;

      // 🟢 Upload avatar baru kalau ada file
      if (avatarFile) {
        const formData = new FormData();
        formData.append("file", avatarFile);

        const upload = await fetch("/api/admin/profile/upload", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        const json = await upload.json();
        if (upload.ok) {
          image_url = json.image_url;
        } else {
          alert("Gagal upload avatar");
          return;
        }
      }

      // 🟢 Update profil
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          image_url,
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Gagal update profil");

      alert("✅ Profil berhasil diperbarui!");
      setAdmin({ ...admin, ...form, image_url });
    } catch (err) {
      console.error("🔥 Update profile error:", err);
      alert("Terjadi kesalahan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading profile...</p>;
  if (!admin) return <p>Admin tidak ditemukan.</p>;

  return (
    <Card className="p-6 max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4">Admin Profile</h2>
      <div className="flex flex-col items-center gap-4">
        <img
          src={admin.image_url || "/default-avatar.png"}
          alt="Admin"
          className="w-24 h-24 rounded-full object-cover border"
        />
        <Input type="file" accept="image/*" onChange={handleFileChange} />

        <Input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
        />
        <Input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
        />

        <Button onClick={handleSave} disabled={saving} className="w-full mt-2">
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Card>
  );
}
