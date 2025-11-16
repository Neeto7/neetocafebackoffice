export type User = {
  id: number;
  name: string;
  email: string;
  password: string;            // hashed
  role: "admin" | "cashier";   // valid role only
  image_url?: string | null;
  is_active: boolean;
  created_at: string;          // timestamptz → string
};
