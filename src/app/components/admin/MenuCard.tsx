"use client";

import { useEffect, useState } from "react";
import { Menu } from "@/types/Menu";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Pencil, Trash } from "lucide-react";

export default function AdminMenuCard() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Menu | null>(null);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch all menus
  const fetchMenus = async () => {
    try {
      const res = await fetch("/api/admin/menu", { credentials: "include" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message || "Failed to fetch");

      setMenus(json.data ?? []);
    } catch (err) {
      console.error("🔥 Fetch menu error:", err);
      setMenus([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(fetchMenus);
  }, []);

  // Toggle availability
  const toggleAvailability = async (slug: string, value: boolean) => {
    try {
      const res = await fetch(`/api/admin/menu/slug?slug=${slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_available: value }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to update");

      setMenus((prev) =>
        prev.map((m) =>
          m.slug === slug ? { ...m, is_available: value } : m
        )
      );
    } catch (err) {
      console.error("🔥 Toggle error:", err);
      alert("Gagal mengubah status menu");
    }
  };

  // Delete menu by slug
  const deleteMenu = async (slug: string) => {
    if (!confirm("Yakin hapus menu ini?")) return;
    try {
      const res = await fetch(`/api/admin/menu/slug?slug=${slug}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) throw new Error("Delete failed");

      setMenus((prev) => prev.filter((m) => m.slug !== slug));
    } catch (err) {
      console.error("🔥 Delete error:", err);
      alert("Gagal menghapus menu");
    }
  };

  // Save edit (update menu)
  const handleSaveEdit = async () => {
    if (!editing) return;

    setSaving(true);

    try {
      let image_url = editing.image_url;

      if (newImage) {
        const fd = new FormData();
        fd.append("file", newImage);

        const up = await fetch("/api/admin/upload", {
          method: "POST",
          body: fd,
          credentials: "include",
        });

        const upJson = await up.json();
        if (!up.ok) throw new Error(upJson?.message || "Upload failed");

        image_url = upJson.image_url;
      }

      const payload = {
        name: editing.name,
        category: editing.category,
        price: editing.price,
        description: editing.description,
        image_url,
        is_available: editing.is_available,
      };

      const res = await fetch(`/api/admin/menu/slug?slug=${editing.slug}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Update failed");

      setMenus((prev) =>
        prev.map((m) => (m.slug === editing.slug ? { ...m, ...payload } : m))
      );

      setEditing(null);
      setNewImage(null);
    } catch (err) {
      console.error("🔥 Save edit error:", err);
      alert("Gagal menyimpan perubahan");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="h-48 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        ⚠️ Tidak ada menu ditemukan.
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 p-3">
        {menus.map((item) => (
          <Card
            key={item.id}
            className={`p-2 rounded-lg shadow-sm border transition-all ${
              item.is_available ? "bg-white" : "bg-gray-100 opacity-80"
            }`}
          >
            <div className="w-full aspect-square rounded-md overflow-hidden bg-gray-100">
              <img
                src={item.image_url ?? "/no-image.png"}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="mt-2">
              <h3 className="font-semibold text-sm line-clamp-1">{item.name}</h3>
              <p className="text-xs text-gray-500 line-clamp-2">
                {item.description ?? "-"}
              </p>
              <p className="font-semibold text-[13px] mt-1">
                Rp {item.price.toLocaleString("id-ID")}
              </p>
            </div>

            <div className="flex items-center justify-between mt-2 text-xs">
              <span className="text-gray-600">Tersedia</span>
              <Switch
                checked={item.is_available}
                onCheckedChange={(c) => toggleAvailability(item.slug, c)}
              />
            </div>

            <div className="flex gap-1 mt-2">
              <Button
                size="sm"
                variant="secondary"
                className="flex-1 text-xs"
                onClick={() => setEditing(item)}
              >
                <Pencil className="w-3 h-3 mr-1" /> Edit
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="flex-1 text-xs"
                onClick={() => deleteMenu(item.slug)}
              >
                <Trash className="w-3 h-3 mr-1" /> Hapus
              </Button>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Menu</DialogTitle>
          </DialogHeader>

          {editing && (
            <div className="space-y-3 mt-2">
              <Input
                value={editing.name}
                onChange={(e) =>
                  setEditing((p) => p && { ...p, name: e.target.value })
                }
                placeholder="Nama"
              />

              <Input
                value={editing.category}
                onChange={(e) =>
                  setEditing((p) => p && { ...p, category: e.target.value })
                }
                placeholder="Kategori"
              />

              <Input
                type="number"
                value={editing.price}
                onChange={(e) =>
                  setEditing((p) => p && { ...p, price: Number(e.target.value) })
                }
                placeholder="Harga"
              />

              <Textarea
                value={editing.description ?? ""}
                onChange={(e) =>
                  setEditing((p) => p && { ...p, description: e.target.value })
                }
                placeholder="Deskripsi"
              />

              <Input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setNewImage(e.target.files?.[0] || null)
                }
              />

              <div className="flex items-center justify-between mt-2 text-xs">
                <span>Tersedia</span>
                <Switch
                  checked={editing.is_available}
                  onCheckedChange={(c) =>
                    setEditing((p) => p && { ...p, is_available: c })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setEditing(null)}>
              Batal
            </Button>
            <Button disabled={saving} onClick={handleSaveEdit}>
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
