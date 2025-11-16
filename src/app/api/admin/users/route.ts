import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabaseAdmin } from "@/lib/supabase/admin";

type UserPayload = {
  name: string;
  email: string;
  password: string;
};

type DeletePayload = {
  id: number;
};

// GET → Ambil cashier
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("role", "cashier")
    .order("id", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST → Tambah cashier
export async function POST(req: Request) {
  const body: UserPayload = await req.json();

  const { name, email, password } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);

  const { error } = await supabaseAdmin.from("users").insert([
    {
      name,
      email,
      password: hashed,
      role: "cashier",
      is_active: true,
    },
  ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Cashier created" });
}

// DELETE → Hapus user
export async function DELETE(req: Request) {
  const body: DeletePayload = await req.json();

  if (!body.id) {
    return NextResponse.json({ error: "User ID required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("users")
    .delete()
    .eq("id", body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "User deleted" });
}
