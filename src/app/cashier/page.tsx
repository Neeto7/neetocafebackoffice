"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CartDrawer } from "@/app/components/cashier/CartDrawer";
import { OrderSummary } from "@/app/components/cashier/OrderSummary";
import { MenuCard } from "@/app/components/cashier/MenuCard";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

export default function CashierPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { ...item, qty: 1 }];
    });
  };

  const removeFromCart = (item: CartItem) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.id === item.id ? { ...i, qty: Math.max(i.qty - 1, 0) } : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);

  const handleSuccess = () => setCart([]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* 🍽️ Bagian Kiri: Menu */}
      <div className="flex-1 p-4 overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Daftar Menu</h2>
        <MenuCard onAdd={addToCart} onRemove={removeFromCart} cart={cart} />
      </div>

      {/* 🧾 Bagian Kanan: Ringkasan Pesanan */}
      <div className="w-full sm:w-[240px] md:w-[260px] lg:w-[280px] xl:w-[300px] 
        border-t lg:border-l bg-white shadow-inner shrink-0">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Ringkasan</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDrawerOpen(true)}
            disabled={cart.length === 0}
          >
            Keranjang ({cart.length})
          </Button>
        </div>

        <OrderSummary />
      </div>

      {/* 🛒 Drawer Keranjang */}
      <CartDrawer
        cart={cart}
        total={total}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
