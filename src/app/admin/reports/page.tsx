"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  format,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
} from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

type OrderHistory = {
  id: string;
  table_number: string;
  customer_name: string;
  subtotal: number;
  created_at: string;
};

type Expense = {
  id: string;
  description: string;
  amount: number;
  created_at: string;
};

export default function ReportsPage() {
  const [loading, setLoading] = useState(true);
  const [todayIncome, setTodayIncome] = useState(0);
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [orders, setOrders] = useState<OrderHistory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [filterMode, setFilterMode] = useState<"daily" | "monthly" | "yearly">(
    "daily"
  );
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd")
  );

  // ===========================================================
  // 🔹 FETCH REPORTS (useCallback agar dependency stabil)
  // ===========================================================
  const fetchReports = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      const date = new Date(selectedDate);

      let start: Date, end: Date;
      if (filterMode === "daily") {
        start = startOfDay(date);
        end = endOfDay(date);
      } else if (filterMode === "monthly") {
        start = startOfMonth(date);
        end = endOfMonth(date);
      } else {
        start = startOfYear(date);
        end = endOfYear(date);
      }

      const { data: orderData, error: orderError } = await supabase
        .from("order_history")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (orderError) throw orderError;

      const { data: expenseData, error: expError } = await supabase
        .from("expenses")
        .select("*")
        .gte("created_at", start.toISOString())
        .lte("created_at", end.toISOString())
        .order("created_at", { ascending: false });

      if (expError) throw expError;

      // Gabung order berdasarkan meja + pelanggan
      const groupedOrders: OrderHistory[] = [];
      const groupMap = new Map<string, OrderHistory>();

      orderData?.forEach((o) => {
        const key = `${o.table_number}-${o.customer_name}`;
        if (groupMap.has(key)) {
          const existing = groupMap.get(key)!;
          existing.subtotal += Number(o.subtotal);
        } else {
          groupMap.set(key, { ...o });
        }
      });

      groupMap.forEach((v) => groupedOrders.push(v));

      const income = groupedOrders.reduce(
        (acc, cur) => acc + Number(cur.subtotal || 0),
        0
      );
      const expense = expenseData?.reduce(
        (acc, cur) => acc + Number(cur.amount || 0),
        0
      );

      setOrders(groupedOrders);
      setExpenses(expenseData || []);
      setTodayIncome(income || 0);
      setTodayExpenses(expense || 0);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat laporan!");
    } finally {
      setLoading(false);
    }
  }, [filterMode, selectedDate]);

  // ===========================================================
  // 🔹 REALTIME UPDATE
  // ===========================================================
  useEffect(() => {
    void fetchReports();

    const channel = supabase
      .channel("realtime:reports")
      .on("postgres_changes", { event: "*", schema: "public", table: "order_history" }, () => void fetchReports())
      .on("postgres_changes", { event: "*", schema: "public", table: "expenses" }, () => void fetchReports())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchReports]);

  // ===========================================================
  // 🔹 TAMBAH PENGELUARAN
  // ===========================================================
  const handleAddExpense = async (): Promise<void> => {
    if (!expenseDesc || !expenseAmount) {
      toast.error("Isi deskripsi dan nominal pengeluaran!");
      return;
    }

    const amountNum = parseFloat(expenseAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error("Nominal tidak valid!");
      return;
    }

    const { error } = await supabase
      .from("expenses")
      .insert([{ description: expenseDesc, amount: amountNum }]);

    if (error) {
      console.error(error);
      toast.error("Gagal menambahkan pengeluaran!");
    } else {
      toast.success("Pengeluaran berhasil ditambahkan!");
      setExpenseDesc("");
      setExpenseAmount("");
      void fetchReports();
    }
  };

  // ===========================================================
  // 🔹 EXPORT EXCEL
  // ===========================================================
  const handleExportExcel = (): void => {
    const wsData = [
      ["Laporan Keuangan", ""],
      ["Filter", `${filterMode.toUpperCase()} - ${selectedDate}`],
      [],
      ["Pemasukan", todayIncome],
      ["Pengeluaran", todayExpenses],
      ["Laba Bersih", todayIncome - todayExpenses],
      [],
      ["Transaksi"],
      ["Waktu", "Pelanggan", "Meja", "Subtotal"],
      ...orders.map((o) => [
        format(new Date(o.created_at), "dd/MM/yyyy HH:mm"),
        o.customer_name || "-",
        o.table_number,
        o.subtotal,
      ]),
      [],
      ["Pengeluaran"],
      ["Waktu", "Deskripsi", "Jumlah"],
      ...expenses.map((e) => [
        format(new Date(e.created_at), "dd/MM/yyyy HH:mm"),
        e.description,
        e.amount,
      ]),
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, "Laporan");
    XLSX.writeFile(wb, `laporan-${filterMode}-${selectedDate}.xlsx`);
  };

  // ===========================================================
  // 🔹 EXPORT PDF
  // ===========================================================
  const handleExportPDF = (): void => {
    const doc = new jsPDF();

    doc.text("Laporan Keuangan", 14, 15);
    doc.text(`Filter: ${filterMode.toUpperCase()} - ${selectedDate}`, 14, 22);
    doc.text(`Pemasukan: Rp ${todayIncome.toLocaleString("id-ID")}`, 14, 32);
    doc.text(`Pengeluaran: Rp ${todayExpenses.toLocaleString("id-ID")}`, 14, 38);
    doc.text(
      `Laba Bersih: Rp ${(todayIncome - todayExpenses).toLocaleString("id-ID")}`,
      14,
      44
    );

    (doc as jsPDF & { autoTable: (options: object) => void }).autoTable({
      startY: 52,
      head: [["Waktu", "Pelanggan", "Meja", "Subtotal"]],
      body: orders.map((o) => [
        format(new Date(o.created_at), "dd/MM/yyyy HH:mm"),
        o.customer_name || "-",
        o.table_number,
        `Rp ${o.subtotal.toLocaleString("id-ID")}`,
      ]),
      theme: "grid",
    });

    const finalY = (doc as jsPDF & { lastAutoTable?: { finalY: number } })
      .lastAutoTable?.finalY ?? 60;

    (doc as jsPDF & { autoTable: (options: object) => void }).autoTable({
      startY: finalY + 10,
      head: [["Waktu", "Deskripsi", "Jumlah"]],
      body: expenses.map((e) => [
        format(new Date(e.created_at), "dd/MM/yyyy HH:mm"),
        e.description,
        `Rp ${e.amount.toLocaleString("id-ID")}`,
      ]),
      theme: "grid",
    });

    doc.save(`laporan-${filterMode}-${selectedDate}.pdf`);
  };

  const netProfit = todayIncome - todayExpenses;

  // ===========================================================
  // 🔹 UI
  // ===========================================================
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">📊 Laporan Keuangan</h1>

      {/* FILTER */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Laporan</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3 items-center">
          <select
            className="border rounded-md p-2"
            value={filterMode}
            onChange={(e) =>
              setFilterMode(e.target.value as "daily" | "monthly" | "yearly")
            }
          >
            <option value="daily">Harian</option>
            <option value="monthly">Bulanan</option>
            <option value="yearly">Tahunan</option>
          </select>

          <Input
            type={
              filterMode === "daily"
                ? "date"
                : filterMode === "monthly"
                ? "month"
                : "number"
            }
            value={
              filterMode === "yearly"
                ? selectedDate.split("-")[0]
                : selectedDate
            }
            onChange={(e) =>
              filterMode === "yearly"
                ? setSelectedDate(`${e.target.value}-01-01`)
                : setSelectedDate(e.target.value)
            }
            className="max-w-[200px]"
          />

          <Button
            onClick={() => void fetchReports()}
            className="bg-[#0C2B4E] text-white hover:bg-[#1D546C]"
          >
            Terapkan
          </Button>

          <div className="flex gap-2 mt-2 md:mt-0">
            <Button
              onClick={handleExportExcel}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Export Excel
            </Button>
            <Button
              onClick={handleExportPDF}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle>Pemasukan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-700">
              Rp {todayIncome.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardHeader>
            <CardTitle>Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-700">
              Rp {todayExpenses.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle>Laba Bersih</CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                netProfit >= 0 ? "text-blue-700" : "text-red-700"
              }`}
            >
              Rp {netProfit.toLocaleString("id-ID")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* TAMBAH PENGELUARAN */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Tambah Pengeluaran</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-3">
          <Input
            placeholder="Deskripsi pengeluaran"
            value={expenseDesc}
            onChange={(e) => setExpenseDesc(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Nominal (Rp)"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
          />
          <Button
            onClick={() => void handleAddExpense()}
            className="bg-[#0C2B4E] text-white hover:bg-[#1D546C]"
          >
            Simpan
          </Button>
        </CardContent>
      </Card>

      {/* TABEL */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TRANSAKSI */}
        <Card>
          <CardHeader>
            <CardTitle>Transaksi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-y-auto max-h-[400px] border rounded-md">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left p-3">Waktu</th>
                    <th className="text-left p-3">Pelanggan</th>
                    <th className="text-left p-3">Meja</th>
                    <th className="text-right p-3">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-gray-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center p-4 text-gray-500">
                        Tidak ada transaksi
                      </td>
                    </tr>
                  ) : (
                    orders.map((o) => (
                      <tr key={o.id} className="border-b">
                        <td className="p-3">
                          {format(new Date(o.created_at), "HH:mm")}
                        </td>
                        <td className="p-3">{o.customer_name || "-"}</td>
                        <td className="p-3">Meja {o.table_number}</td>
                        <td className="p-3 text-right">
                          Rp {o.subtotal.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* PENGELUARAN */}
        <Card>
          <CardHeader>
            <CardTitle>Pengeluaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-y-auto max-h-[400px] border rounded-md">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-100 border-b">
                  <tr>
                    <th className="text-left p-3">Waktu</th>
                    <th className="text-left p-3">Deskripsi</th>
                    <th className="text-right p-3">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center p-4 text-gray-500">
                        Tidak ada pengeluaran
                      </td>
                    </tr>
                  ) : (
                    expenses.map((e) => (
                      <tr key={e.id} className="border-b">
                        <td className="p-3">
                          {format(new Date(e.created_at), "HH:mm")}
                        </td>
                        <td className="p-3">{e.description}</td>
                        <td className="p-3 text-right">
                          Rp {e.amount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
