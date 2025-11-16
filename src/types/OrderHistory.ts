export type OrderHistory = {
  id: string; // uuid
  order_id: string | null;
  order_item_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  table_number: string;
  menu_id: number | null;
  menu_name: string;
  price: number;
  qty: number;
  subtotal: number | null;
  status: string;
  created_at: string; // ISO timestamp
  finished_at: string; // ISO timestamp
};
