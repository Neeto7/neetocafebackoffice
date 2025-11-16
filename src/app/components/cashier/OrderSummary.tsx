"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/Order";
import { OrderItem } from "@/types/OrderItem";

type OrderWithItems = Order & {
  items: OrderItem[];
};

export function OrderSummary() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔹 Ambil semua data orders + items
  const fetchOrders = useCallback(async () => {
    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .neq("status", "completed")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      if (!ordersData?.length) {
        setOrders([]);
        return;
      }

      const orderIds = ordersData.map((o) => o.id);
      const { data: itemsData, error: itemsError } = await supabase
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) throw itemsError;

      const ordersWithItems = ordersData.map((order) => ({
        ...order,
        items: itemsData?.filter((i) => i.order_id === order.id) ?? [],
      }));

      setOrders(ordersWithItems);
    } catch (err) {
      console.error("❌ Gagal memuat pesanan:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔄 Jalankan fetch pertama + aktifkan realtime listener
  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("orders_realtime_channel")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
        },
        (payload) => {
          console.log("📡 Realtime - orders:", payload);
          fetchOrders();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "order_items",
        },
        (payload) => {
          console.log("📡 Realtime - order_items:", payload);
          fetchOrders();
        }
      )
      .subscribe((status) => {
        console.log("✅ Channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // ✅ Tandai pesanan selesai
  const handleComplete = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    try {
      const historyData = order.items.map((item) => ({
        order_id: order.id,
        order_item_id: item.id,
        customer_id: order.customer_id,
        customer_name: order.customer_name,
        table_number: order.table_number,
        menu_id: item.menu_id,
        menu_name: item.name,
        price: item.price,
        qty: item.qty,
        status: "completed",
        finished_at: new Date().toISOString(),
      }));

      const { error: historyError } = await supabase
        .from("order_history")
        .insert(historyData);
      if (historyError) throw historyError;

      await supabase.from("order_items").delete().eq("order_id", orderId);
      await supabase.from("orders").delete().eq("id", orderId);

      // Optimistic UI update
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } catch (err) {
      console.error("❌ Gagal selesaikan pesanan:", err);
      alert("Gagal memindahkan ke riwayat pesanan!");
    }
  };

  // 🕐 State Loading
  if (loading) {
    return <div className="p-4 text-gray-400">Memuat pesanan...</div>;
  }

  // 💤 Tidak ada pesanan aktif
  if (orders.length === 0) {
    return <div className="p-4 text-gray-400">Belum ada pesanan aktif.</div>;
  }

  // 🧾 Render daftar pesanan
  return (
    <div className="p-3 flex flex-wrap gap-3">
      {orders.map((order) => (
        <Card
          key={order.id}
          className="p-4 rounded-xl shadow-md flex flex-col justify-between bg-[#0C2B4E] text-white w-[290px] transition-all duration-300 hover:scale-[1.02]"
        >
          <div>
            <h3 className="font-semibold text-lg mb-1">
              Meja {order.table_number}
            </h3>

            {order.customer_name && (
              <p className="text-sm opacity-80 mb-2">
                Pemesan: {order.customer_name}
              </p>
            )}

            <div className="mb-3 flex flex-col gap-1">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm opacity-90"
                >
                  <span>
                    {item.name} × {item.qty}
                  </span>
                  <span>
                    Rp {(item.price * item.qty).toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-white/20 my-2" />

            <div className="flex justify-between items-center mt-1">
              <span className="font-medium text-base">Total</span>
              <span className="font-semibold text-lg">
                Rp {order.total_price?.toLocaleString("id-ID") ?? "0"}
              </span>
            </div>

            <p className="text-xs opacity-60 mt-2">
              {new Date(order.created_at).toLocaleString("id-ID")}
            </p>
          </div>

          <Button
            size="sm"
            className="mt-3 bg-white hover:bg-gray-200 text-[#0C2B4E] font-medium"
            onClick={() => handleComplete(order.id)}
          >
            Tandai Selesai
          </Button>
        </Card>
      ))}
    </div>
  );
}
