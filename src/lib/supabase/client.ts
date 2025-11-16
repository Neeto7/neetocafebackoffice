import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true, // penting agar session disimpan di localStorage
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
