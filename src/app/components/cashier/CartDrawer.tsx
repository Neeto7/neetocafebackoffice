"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner"; // ✅ pakai toast Shadcn v4

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type CartDrawerProps = {
  cart: CartItem[];
  total: number;
  onClose: () => void;
  open: boolean;
  onSuccess: () => void;
};

export function CartDrawer({
  cart,
  total,
  onClose,
  open,
  onSuccess,
}: CartDrawerProps) {
  const [loading, setLoading] = useState(false);
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");

  const handleSubmit = async () => {
    // 🔹 Validasi input
    if (!cart.length) return toast.error("Tambahkan pesanan terlebih dahulu!");
    if (!tableNumber) return toast.error("Nomor meja harus diisi!");
    if (!customerName) return toast.error("Nama pelanggan harus diisi!");

    // 🔹 Pastikan nomor meja hanya angka
    if (!/^\d+$/.test(tableNumber)) {
      return toast.error("Nomor meja hanya boleh angka!");
    }

    setLoading(true);

    try {
      // 🔹 Insert ke tabel "orders"
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert([
          {
            table_number: tableNumber,
            total_price: total,
            status: "pending",
            customer_name: customerName,
          },
        ])
        .select()
        .single();

      if (orderError) throw orderError;

      // 🔹 Insert ke tabel "order_items"
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        menu_id: item.id,
        name: item.name,
        price: item.price,
        qty: item.qty,
      }));

      const { error: itemError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemError) throw itemError;

      // ✅ Update UI tanpa menunggu realtime
      onSuccess();

      // ✅ Broadcast realtime optional
      await supabase.channel("orders:update").send({
        type: "broadcast",
        event: "new-order",
        payload: { orderId: order.id },
      });

      toast.success(`Pesanan meja ${tableNumber} berhasil dibuat!`);
      onClose();
      setCustomerName("");
      setTableNumber("");
    } catch (err) {
      console.error("Gagal buat pesanan:", err);
      toast.error("Gagal membuat pesanan!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Keranjang Pesanan</DrawerTitle>
        </DrawerHeader>

        {/* 🧩 Layout utama */}
        <div className="flex flex-col h-[80vh]">
          {/* 🧾 Daftar item scrollable */}
          <div className="flex-1 overflow-y-auto px-4">
            {cart.length === 0 ? (
              <p className="text-gray-500 text-sm text-center mt-4">
                Belum ada item di keranjang.
              </p>
            ) : (
              <div className="border rounded-md divide-y">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-2 text-sm"
                  >
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.qty} × Rp {item.price.toLocaleString("id-ID")}
                      </p>
                    </div>
                    <p className="font-semibold">
                      Rp {(item.qty * item.price).toLocaleString("id-ID")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 🧍 Form + Total + Tombol sticky di bawah */}
          <div className="border-t bg-white p-4 space-y-3 sticky bottom-0">
            {/* Nama pelanggan */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nama Pelanggan</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Masukkan nama pelanggan"
              />
            </div>

            {/* Nomor meja */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Nomor Meja</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={tableNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setTableNumber(value);
                }}
                className="border rounded-md px-3 py-2 text-sm"
                placeholder="Contoh: 1 / 5 / 12"
              />
            </div>

            {/* Total harga */}
            <div className="flex justify-between items-center mt-2">
              <span className="font-semibold">Total:</span>
              <span className="font-bold text-lg">
                Rp {total.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Tombol submit */}
            <Button
              disabled={loading || !cart.length}
              onClick={handleSubmit}
              className="w-full mt-3 bg-[#0C2B4E] text-white hover:bg-[#1D546C]"
            >
              {loading ? "Menyimpan..." : "Buat Pesanan"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
