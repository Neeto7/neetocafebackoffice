export type UserUpdate = {
  id?: number;
  name?: string;
  email?: string;
  password?: string;
  role?: "admin" | "cashier";
  image_url?: string | null;
  is_active?: boolean;
};
