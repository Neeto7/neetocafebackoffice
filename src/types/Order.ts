export type Order = {
  id: string;                 
  customer_id: string | null; 
  customer_name: string | null;
  table_number: string;
  total_price: number;
  status: "pending" | "processing" | "completed";
  created_at: string;         
};