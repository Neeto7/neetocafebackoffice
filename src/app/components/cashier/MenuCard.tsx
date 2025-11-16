"use client";

import { Menu } from "@/types/Menu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type MenuCardProps = {
  onAdd: (item: CartItem) => void;
  onRemove: (item: CartItem) => void;
  cart: CartItem[];
};

// Strong typed version of Menu with guaranteed string image_url
type MenuWithUrl = Menu & {
  image_url: string;
};

export const MenuCard = ({ onAdd, onRemove, cart }: MenuCardProps) => {
  const [menus, setMenus] = useState<MenuWithUrl[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMenus = async () => {
      const { data, error } = await supabase
        .from("menu")
        .select("*")
        .eq("is_available", true)
        .order("name", { ascending: true });

      if (error) {
        console.error("Error fetching menu:", error);
        setMenus([]);
      } else {
        const menusWithUrl: MenuWithUrl[] =
          data?.map((item) => ({
            ...item,
            image_url: item.image_url ?? "/no-image.png",
          })) ?? [];

        setMenus(menusWithUrl);
      }

      setLoading(false);
    };

    fetchMenus();
  }, []);

  if (loading) {
    return (
      <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="h-40 bg-gray-200 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="p-4 text-gray-500 text-sm">
        Belum ada menu yang tersedia.
      </div>
    );
  }

  const handleRemoveAll = (item: MenuWithUrl, qty: number) => {
    if (qty > 0) {
      onRemove({ id: item.id, name: item.name, price: item.price, qty });
    }
  };

  return (
    <div className="p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {menus.map((item) => {
        const currentQty = cart.find((c) => c.id === item.id)?.qty || 0;

        return (
          <Card
            key={item.id}
            className="bg-white text-black p-2 rounded-lg shadow hover:shadow-md transition-all duration-200 flex flex-col"
          >
            {/* Gambar lebih kecil */}
            <div className="w-full aspect-square rounded-md overflow-hidden bg-gray-100">
              <img
                src={item.image_url}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Nama & Harga pendek */}
            <h3 className="font-semibold mt-1 text-sm line-clamp-1">
              {item.name}
            </h3>
            <span className="font-semibold text-[13px]">
              Rp {item.price.toLocaleString("id-ID")}
            </span>

            {/* Tombol kecil */}
            <div className="flex items-center justify-between mt-1">
              <Button
                size="icon"
                variant="secondary"
                className="w-6 h-6 text-xs"
                onClick={() =>
                  currentQty > 0 &&
                  onRemove({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    qty: 1,
                  })
                }
              >
                -
              </Button>

              <span className="text-sm font-medium min-w-[18px] text-center">
                {currentQty}
              </span>

              <Button
                size="icon"
                className="w-6 h-6 text-xs"
                onClick={() =>
                  onAdd({
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    qty: 1,
                  })
                }
              >
                +
              </Button>
            </div>

            {/* Hapus semua kecil */}
            {currentQty > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="mt-1 w-full text-[10px] py-1"
                onClick={() => handleRemoveAll(item, currentQty)}
              >
                Hapus
              </Button>
            )}
          </Card>
        );
      })}
    </div>
  );
};
