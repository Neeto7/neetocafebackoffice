export type Menu = {
  id: string;                 // uuid (Supabase default)
  name: string;
  slug: string;
  category: string;
  price: number;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
};