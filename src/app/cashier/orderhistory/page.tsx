"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { Card } from "@/components/ui/card";

type OrderItem = {
  id: string;
  menu_id: number | null;
  menu_name: string;
  price: number;
  qty: number;
};

type HistoryItem = {
  order_id: string;
  customer_id: string | null;
  customer_name: string | null;
  table_number: string;
  items: OrderItem[];
  total_price: number;
  finished_at: string;
};

export default function OrderHistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchTimeout = useRef<NodeJS.Timeout | null>(null);

  // ✅ Fetch dan group data
  const fetchHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("order_history")
        .select("*")
        .order("finished_at", { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) {
        setHistory([]);
        return;
      }

      const grouped: Record<string, HistoryItem> = {};

      for (const row of data) {
        if (!row.order_id) continue;

        if (!grouped[row.order_id]) {
          grouped[row.order_id] = {
            order_id: row.order_id,
            customer_id: row.customer_id ?? null,
            customer_name: row.customer_name ?? null,
            table_number: row.table_number ?? "-",
            items: [],
            total_price: 0,
            finished_at: row.finished_at,
          };
        }

        grouped[row.order_id].items.push({
          id: row.order_item_id,
          menu_id: row.menu_id ?? null,
          menu_name: row.menu_name,
          price: parseFloat(row.price),
          qty: row.qty,
        });

        grouped[row.order_id].total_price += parseFloat(row.price) * row.qty;
      }

      const sorted = Object.values(grouped).sort(
        (a, b) =>
          new Date(b.finished_at).getTime() -
          new Date(a.finished_at).getTime()
      );

      setHistory(sorted);
    } catch (err) {
      console.error("❌ Gagal memuat riwayat:", err);
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // 📡 Realtime listener (debounce agar tidak flicker)
  useEffect(() => {
    let mounted = true;
    fetchHistory();

    const channel = supabase
      .channel("order_history_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "order_history" },
        () => {
          if (!mounted) return;

          if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
          // 🔹 debounce 500ms biar ga flicker
          fetchTimeout.current = setTimeout(() => {
            fetchHistory();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (fetchTimeout.current) clearTimeout(fetchTimeout.current);
      supabase.removeChannel(channel);
    };
  }, [fetchHistory]);

  if (loading)
    return <div className="p-4 text-gray-400">Memuat riwayat pesanan...</div>;

  if (history.length === 0)
    return <div className="p-4 text-gray-400">Belum ada riwayat pesanan.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex flex-col gap-4">
      <h1 className="text-xl font-bold mb-2">Riwayat Pesanan</h1>

      {history.map((order) => (
        <Card
          key={order.order_id}
          className="p-4 rounded-xl shadow bg-white flex flex-col gap-2"
        >
          <div className="flex justify-between items-center">
            <h2 className="font-semibold text-lg">
              Meja {order.table_number}
            </h2>
            <span className="text-sm text-gray-500">
              {new Date(order.finished_at).toLocaleString("id-ID")}
            </span>
          </div>

          {order.customer_name && (
            <p className="text-sm text-gray-600">
              Pemesan: {order.customer_name}
            </p>
          )}

          <div className="mt-2">
            {order.items.map((item, idx) => (
              <div
                key={`${order.order_id}-${item.id}-${idx}`}
                className="flex justify-between text-sm text-gray-700"
              >
                <span>
                  {item.menu_name} × {item.qty}
                </span>
                <span>
                  Rp {(item.price * item.qty).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>

          <p className="mt-2 font-semibold text-right">
            Total: Rp {order.total_price.toLocaleString("id-ID")}
          </p>
        </Card>
      ))}
    </div>
  );
}
