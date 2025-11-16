"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function MenuManager() {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    category: "",
    price: "",
    description: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setImageFile(e.target.files[0]);
  };

  const handleCreate = async () => {
    if (!imageFile) return alert("Upload gambar dulu.");
    const priceNumber = Number(form.price);
    if (isNaN(priceNumber) || priceNumber <= 0) return alert("Harga tidak valid.");

    setLoading(true);
    try {
      // Upload gambar
      const formData = new FormData();
      formData.append("file", imageFile);

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadJson.message || "Upload gagal");

      const { image_url } = uploadJson;

      // Insert menu baru
      const newMenu = {
        name: form.name,
        slug: form.slug,
        category: form.category,
        price: priceNumber,
        description: form.description,
        image_url,
        is_available: true,
      };

      const res = await fetch("/api/admin/menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMenu),
        credentials: "include",
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Insert gagal");

      setForm({ name: "", slug: "", category: "", price: "", description: "" });
      setImageFile(null);
      alert("✅ Menu berhasil ditambahkan!");
    } catch (err) {
      console.error("🔥 Error handleCreate:", err);
      alert("Terjadi kesalahan server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4 space-y-6">
      <CardHeader>
        <h2 className="font-bold text-xl">Tambah Menu Baru</h2>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input name="name" placeholder="Nama Menu" value={form.name} onChange={handleChange} />
          <Input name="slug" placeholder="Slug" value={form.slug} onChange={handleChange} />
          <Input name="category" placeholder="Kategori" value={form.category} onChange={handleChange} />
          <Input name="price" placeholder="Harga" type="number" value={form.price} onChange={handleChange} />
          <Textarea name="description" placeholder="Deskripsi" value={form.description} onChange={handleChange} />
          <Input type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <Button className="mt-2 w-full" disabled={loading} onClick={handleCreate}>
          {loading ? "Menyimpan..." : "Tambah Menu"}
        </Button>
      </CardContent>
    </Card>
  );
}
