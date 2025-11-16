export type UserInsert = {
  id?: number;
  name: string;
  email: string;
  password: string;            // already hashed
  role: "admin" | "cashier";
  image_url?: string | null;
  is_active?: boolean;
};
